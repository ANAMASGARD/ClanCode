import { eq, sql } from "drizzle-orm";

import type { ClanPlacement } from "@/app/game/state/clan-layout";
import { mergeSavedLayout, validateLayout } from "@/app/game/state/layout-editor";
import { getDb } from "@/app/lib/db";
import { clanLayouts } from "@/app/lib/db/schema/clan-layouts";

export function isMissingClanLayoutsTable(error: unknown): boolean {
  let current: unknown = error;
  while (current && typeof current === "object") {
    const record = current as { code?: string; cause?: unknown; message?: string };
    if (record.code === "42P01") return true;
    if (
      typeof record.message === "string" &&
      record.message.includes("clan_layouts") &&
      record.message.includes("does not exist")
    ) {
      return true;
    }
    current = record.cause;
  }
  return false;
}

export async function ensureClanLayoutsTable(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "clan_layouts" (
      "clerk_user_id" text PRIMARY KEY NOT NULL,
      "placements" jsonb NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type SemanticPlacementEntry = Extract<ClanPlacement, { kind: "semantic" }>;
type DecorativePlacementEntry = Extract<ClanPlacement, { kind: "decorative" }>;
type PropPlacementEntry = Extract<ClanPlacement, { kind: "prop" }>;

function isSemanticEntry(value: Record<string, unknown>): value is SemanticPlacementEntry {
  return (
    value.kind === "semantic" &&
    typeof value.id === "string" &&
    typeof value.tileX === "number" &&
    typeof value.tileZ === "number"
  );
}

function isDecorativeEntry(value: Record<string, unknown>): value is DecorativePlacementEntry {
  return (
    value.kind === "decorative" &&
    typeof value.id === "string" &&
    typeof value.prefab === "string" &&
    typeof value.tileX === "number" &&
    typeof value.tileZ === "number"
  );
}

function isPropEntry(value: Record<string, unknown>): value is PropPlacementEntry {
  return (
    value.kind === "prop" &&
    typeof value.id === "string" &&
    typeof value.assetKey === "string" &&
    typeof value.tileX === "number" &&
    typeof value.tileZ === "number"
  );
}

export function parsePlacementsPayload(raw: unknown): ClanPlacement[] | null {
  if (!Array.isArray(raw)) return null;

  const parsed: ClanPlacement[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) return null;

    const rotation = entry.rotation === undefined ? undefined : Number(entry.rotation);
    if (rotation !== undefined && !Number.isFinite(rotation)) return null;

    const tileX = Number(entry.tileX);
    const tileZ = Number(entry.tileZ);
    if (!Number.isFinite(tileX) || !Number.isFinite(tileZ)) return null;

    if (isSemanticEntry(entry)) {
      parsed.push({
        kind: "semantic",
        id: entry.id,
        tileX,
        tileZ,
        rotation,
      });
      continue;
    }

    if (isDecorativeEntry(entry)) {
      parsed.push({
        kind: "decorative",
        id: entry.id,
        prefab: entry.prefab,
        tileX,
        tileZ,
        rotation,
      });
      continue;
    }

    if (isPropEntry(entry)) {
      parsed.push({
        kind: "prop",
        id: entry.id,
        assetKey: entry.assetKey,
        tileX,
        tileZ,
        rotation,
      });
      continue;
    }

    return null;
  }

  return parsed;
}

export async function getLayoutForUser(clerkUserId: string): Promise<ClanPlacement[] | null> {
  await ensureClanLayoutsTable();
  const db = getDb();
  const rows = await db
    .select()
    .from(clanLayouts)
    .where(eq(clanLayouts.clerkUserId, clerkUserId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const parsed = parsePlacementsPayload(row.placements);
  if (!parsed) return null;

  return mergeSavedLayout(parsed);
}

export async function saveLayoutForUser(
  clerkUserId: string,
  rawPlacements: unknown,
): Promise<{ placements: ClanPlacement[] } | { error: string }> {
  const parsed = parsePlacementsPayload(rawPlacements);
  if (!parsed) {
    return { error: "invalid_payload" };
  }

  const validation = validateLayout(parsed);
  if (!validation.valid) {
    return { error: validation.reason ?? "invalid_layout" };
  }

  await ensureClanLayoutsTable();
  const db = getDb();
  await db
    .insert(clanLayouts)
    .values({
      clerkUserId,
      placements: parsed,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: clanLayouts.clerkUserId,
      set: {
        placements: parsed,
        updatedAt: new Date(),
      },
    });

  return { placements: parsed };
}
