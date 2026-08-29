import { and, desc, eq, lt, sql } from "drizzle-orm";

import { getDb } from "@/app/lib/db";
import {
  devices,
  pairingChallenges,
  pairingDeliveries,
} from "@/app/lib/db/schema";
import {
  DEVICE_HEARTBEAT_TTL_MS,
  generateDeviceCode,
  generateDeviceToken,
  generateUserCode,
  hashToken,
  normalizeUserCode,
  PAIRING_CHALLENGE_TTL_MS,
  PAIRING_POLL_INTERVAL_MS,
  safeCompareHashes,
} from "@/app/lib/pairing/constants";
import { decryptDeviceToken, encryptDeviceToken } from "@/app/lib/pairing/crypto";

export type PairStartInput = {
  hostname?: string;
  platform?: string;
};

export type PairStartResult = {
  userCode: string;
  deviceCode: string;
  verifyUrl: string;
  expiresIn: number;
  interval: number;
};

export type PairPollResult =
  | { status: "pending" }
  | { status: "denied" }
  | { status: "expired" }
  | { status: "slow_down" }
  | { status: "approved"; token: string; deviceId: string; controlUrl: string };

export type DeviceListItem = {
  id: string;
  label: string;
  platform: string | null;
  status: "pending" | "active" | "revoked";
  online: boolean;
  lastSeenAt: string | null;
  createdAt: string;
};

function resolveWebUrl(): string {
  return (
    process.env.CLANCODE_WEB_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function resolveControlUrl(): string {
  return (process.env.CLANCODE_REALTIME_URL ?? "http://localhost:3001").replace(
    /\/$/,
    "",
  );
}

async function expireStaleChallenges(now = new Date()): Promise<void> {
  const db = getDb();
  await db
    .update(pairingChallenges)
    .set({ status: "expired" })
    .where(
      and(
        lt(pairingChallenges.expiresAt, now),
        sql`${pairingChallenges.status} IN ('pending', 'approved')`,
      ),
    );
}

export async function startPairingChallenge(
  input: PairStartInput,
): Promise<PairStartResult> {
  const db = getDb();
  await expireStaleChallenges();
  const deviceCode = generateDeviceCode();
  const deviceCodeHash = hashToken(deviceCode);
  const expiresAt = new Date(Date.now() + PAIRING_CHALLENGE_TTL_MS);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const userCode = generateUserCode();
    try {
      await db.insert(pairingChallenges).values({
        userCode: normalizeUserCode(userCode),
        deviceCodeHash,
        hostname: input.hostname,
        platform: input.platform,
        expiresAt,
      });
      const webUrl = resolveWebUrl();
      return {
        userCode,
        deviceCode,
        verifyUrl: `${webUrl}/pair?code=${encodeURIComponent(userCode)}`,
        expiresIn: Math.floor(PAIRING_CHALLENGE_TTL_MS / 1000),
        interval: Math.floor(PAIRING_POLL_INTERVAL_MS / 1000),
      };
    } catch {
      // user_code collision — retry
    }
  }
  throw new Error("Could not create pairing challenge");
}

export async function pollPairingChallenge(input: {
  deviceCode: string;
}): Promise<PairPollResult> {
  const db = getDb();
  const now = new Date();
  await expireStaleChallenges(now);
  const deviceCodeHash = hashToken(input.deviceCode);

  const challengeRows = await db
    .select()
    .from(pairingChallenges)
    .where(eq(pairingChallenges.deviceCodeHash, deviceCodeHash))
    .limit(1);
  const challenge = challengeRows[0];
  if (challenge === undefined) {
    return { status: "expired" };
  }

  if (challenge.status === "denied") {
    return { status: "denied" };
  }
  if (challenge.status === "consumed") {
    return { status: "expired" };
  }
  if (challenge.expiresAt < now || challenge.status === "expired") {
    if (challenge.status !== "expired") {
      await db
        .update(pairingChallenges)
        .set({ status: "expired" })
        .where(eq(pairingChallenges.id, challenge.id));
    }
    return { status: "expired" };
  }

  if (challenge.lastPollAt !== null) {
    const elapsed = now.getTime() - challenge.lastPollAt.getTime();
    if (elapsed < PAIRING_POLL_INTERVAL_MS) {
      return { status: "slow_down" };
    }
  }

  await db
    .update(pairingChallenges)
    .set({ lastPollAt: now })
    .where(eq(pairingChallenges.id, challenge.id));

  if (challenge.status === "pending") {
    return { status: "pending" };
  }
  if (challenge.status !== "approved" || challenge.deviceId === null) {
    return { status: "pending" };
  }

  return await db.transaction(async (tx) => {
    const lockedRows = await tx
      .select()
      .from(pairingChallenges)
      .where(
        and(
          eq(pairingChallenges.id, challenge.id),
          eq(pairingChallenges.status, "approved"),
        ),
      )
      .limit(1);
    const locked = lockedRows[0];
    if (locked === undefined || locked.deviceId === null) {
      return { status: "pending" } satisfies PairPollResult;
    }

    const deliveryRows = await tx
      .select()
      .from(pairingDeliveries)
      .where(eq(pairingDeliveries.challengeId, locked.id))
      .limit(1);
    const delivery = deliveryRows[0];
    if (delivery === undefined) {
      return { status: "expired" } satisfies PairPollResult;
    }

    const deleted = await tx
      .delete(pairingDeliveries)
      .where(eq(pairingDeliveries.challengeId, locked.id))
      .returning({ challengeId: pairingDeliveries.challengeId });
    if (deleted.length === 0) {
      return { status: "expired" } satisfies PairPollResult;
    }

    await tx
      .update(pairingChallenges)
      .set({ status: "consumed" })
      .where(
        and(
          eq(pairingChallenges.id, locked.id),
          eq(pairingChallenges.status, "approved"),
        ),
      );

    await tx
      .update(devices)
      .set({ status: "active" })
      .where(
        and(eq(devices.id, locked.deviceId), eq(devices.status, "pending")),
      );

    const token = decryptDeviceToken({
      iv: delivery.iv,
      ciphertext: delivery.ciphertext,
      authTag: delivery.authTag,
    });

    return {
      status: "approved",
      token,
      deviceId: locked.deviceId,
      controlUrl: resolveControlUrl(),
    } satisfies PairPollResult;
  });
}

export async function approvePairingChallenge(input: {
  userCode: string;
  clerkUserId: string;
  label?: string;
}): Promise<{ ok: true; deviceId: string } | { ok: false; reason: string }> {
  const db = getDb();
  const now = new Date();
  await expireStaleChallenges(now);
  const normalized = normalizeUserCode(input.userCode);

  const challengeRows = await db
    .select()
    .from(pairingChallenges)
    .where(eq(pairingChallenges.userCode, normalized))
    .limit(1);
  const challenge = challengeRows[0];
  if (challenge === undefined) {
    return { ok: false, reason: "not_found" };
  }
  if (challenge.status === "denied") {
    return { ok: false, reason: "denied" };
  }
  if (challenge.status !== "pending") {
    return { ok: false, reason: "invalid_state" };
  }
  if (challenge.expiresAt < now) {
    await db
      .update(pairingChallenges)
      .set({ status: "expired" })
      .where(eq(pairingChallenges.id, challenge.id));
    return { ok: false, reason: "expired" };
  }

  const token = generateDeviceToken();
  const tokenHash = hashToken(token);
  const label =
    input.label ??
    challenge.hostname ??
    challenge.platform ??
    "ClanCode device";
  const encrypted = encryptDeviceToken(token);

  return await db.transaction(async (tx) => {
    const updated = await tx
      .update(pairingChallenges)
      .set({
        status: "approved",
        clerkUserId: input.clerkUserId,
      })
      .where(
        and(
          eq(pairingChallenges.id, challenge.id),
          eq(pairingChallenges.status, "pending"),
        ),
      )
      .returning({ id: pairingChallenges.id });

    if (updated.length === 0) {
      return { ok: false as const, reason: "invalid_state" };
    }

    const [device] = await tx
      .insert(devices)
      .values({
        clerkUserId: input.clerkUserId,
        label,
        platform: challenge.platform,
        tokenHash,
        status: "pending",
      })
      .returning({ id: devices.id });

    await tx
      .update(pairingChallenges)
      .set({ deviceId: device.id })
      .where(eq(pairingChallenges.id, challenge.id));

    await tx.insert(pairingDeliveries).values({
      challengeId: challenge.id,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      authTag: encrypted.authTag,
    });

    return { ok: true as const, deviceId: device.id };
  });
}

export async function denyPairingChallenge(input: {
  userCode: string;
  clerkUserId: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const db = getDb();
  const now = new Date();
  await expireStaleChallenges(now);
  const normalized = normalizeUserCode(input.userCode);

  const challengeRows = await db
    .select()
    .from(pairingChallenges)
    .where(eq(pairingChallenges.userCode, normalized))
    .limit(1);
  const challenge = challengeRows[0];
  if (challenge === undefined) {
    return { ok: false, reason: "not_found" };
  }
  if (challenge.status !== "pending") {
    return { ok: false, reason: "invalid_state" };
  }
  if (challenge.expiresAt < now) {
    await db
      .update(pairingChallenges)
      .set({ status: "expired" })
      .where(eq(pairingChallenges.id, challenge.id));
    return { ok: false, reason: "expired" };
  }

  const updated = await db
    .update(pairingChallenges)
    .set({ status: "denied", clerkUserId: input.clerkUserId })
    .where(
      and(
        eq(pairingChallenges.id, challenge.id),
        eq(pairingChallenges.status, "pending"),
      ),
    )
    .returning({ id: pairingChallenges.id });

  if (updated.length === 0) {
    return { ok: false, reason: "invalid_state" };
  }
  return { ok: true };
}

export async function listDevicesForUser(
  clerkUserId: string,
): Promise<DeviceListItem[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(devices)
    .where(eq(devices.clerkUserId, clerkUserId))
    .orderBy(desc(devices.createdAt));
  const now = Date.now();
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    platform: row.platform,
    status: row.status,
    online:
      row.status === "active" &&
      row.lastSeenAt !== null &&
      now - row.lastSeenAt.getTime() < DEVICE_HEARTBEAT_TTL_MS,
    lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function revokeDevice(input: {
  deviceId: string;
  clerkUserId: string;
}): Promise<boolean> {
  const db = getDb();
  const updated = await db
    .update(devices)
    .set({
      status: "revoked",
      connectionState: "offline",
      revokedAt: new Date(),
    })
    .where(
      and(
        eq(devices.id, input.deviceId),
        eq(devices.clerkUserId, input.clerkUserId),
        sql`${devices.status} != 'revoked'`,
      ),
    )
    .returning({ id: devices.id });
  return updated.length > 0;
}

export async function findDeviceByTokenHash(tokenHash: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(devices)
    .where(eq(devices.tokenHash, tokenHash))
    .limit(1);
  return rows[0];
}

export async function touchDevicePresence(input: {
  deviceId: string;
  connectionState: "online" | "offline";
}): Promise<void> {
  const db = getDb();
  await db
    .update(devices)
    .set({
      connectionState: input.connectionState,
      lastSeenAt: input.connectionState === "online" ? new Date() : undefined,
    })
    .where(eq(devices.id, input.deviceId));
}

export async function touchDeviceHeartbeat(deviceId: string): Promise<boolean> {
  const db = getDb();
  const updated = await db
    .update(devices)
    .set({
      lastSeenAt: new Date(),
      connectionState: "online",
    })
    .where(
      and(eq(devices.id, deviceId), eq(devices.status, "active")),
    )
    .returning({ id: devices.id });
  return updated.length > 0;
}

export { safeCompareHashes, hashToken, DEVICE_HEARTBEAT_TTL_MS };
