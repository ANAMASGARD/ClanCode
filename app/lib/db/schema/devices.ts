import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const deviceStatusEnum = pgEnum("device_status", [
  "pending",
  "active",
  "revoked",
]);

export const pairingChallengeStatusEnum = pgEnum("pairing_challenge_status", [
  "pending",
  "approved",
  "consumed",
  "expired",
  "denied",
]);

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull(),
    label: text("label").notNull(),
    platform: text("platform"),
    tokenHash: text("token_hash").notNull().unique(),
    status: deviceStatusEnum("status").notNull().default("pending"),
    connectionState: text("connection_state").notNull().default("offline"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("devices_clerk_user_id_idx").on(table.clerkUserId),
    index("devices_token_hash_idx").on(table.tokenHash),
  ],
);

export const pairingChallenges = pgTable(
  "pairing_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userCode: text("user_code").notNull().unique(),
    deviceCodeHash: text("device_code_hash").notNull(),
    hostname: text("hostname"),
    platform: text("platform"),
    status: pairingChallengeStatusEnum("status").notNull().default("pending"),
    clerkUserId: text("clerk_user_id"),
    deviceId: uuid("device_id").references(() => devices.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastPollAt: timestamp("last_poll_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pairing_challenges_user_code_idx").on(table.userCode),
    index("pairing_challenges_device_code_hash_idx").on(table.deviceCodeHash),
  ],
);

export const pairingDeliveries = pgTable("pairing_deliveries", {
  challengeId: uuid("challenge_id")
    .primaryKey()
    .references(() => pairingChallenges.id, { onDelete: "cascade" }),
  iv: text("iv").notNull(),
  ciphertext: text("ciphertext").notNull(),
  authTag: text("auth_tag").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
