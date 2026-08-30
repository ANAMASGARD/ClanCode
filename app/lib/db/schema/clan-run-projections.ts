import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const clanRunProjections = pgTable("clan_run_projections", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  deviceId: text("device_id"),
  runId: text("run_id"),
  requestedMode: text("requested_mode"),
  phase: text("phase").notNull().default("idle"),
  promptPreview: text("prompt_preview"),
  lastTool: text("last_tool"),
  lastEventType: text("last_event_type"),
  approvals: jsonb("approvals").notNull().$type<unknown>().default([]),
  approvalDecision: text("approval_decision"),
  validationStatus: text("validation_status").notNull().default("idle"),
  deliveryStage: text("delivery_stage").notNull().default("idle"),
  prUrl: text("pr_url"),
  prNumber: integer("pr_number"),
  storeys: integer("storeys").notNull().default(1),
  changed: boolean("changed").notNull().default(false),
  lastSequence: integer("last_sequence").notNull().default(0),
  lastCompletedRunId: text("last_completed_run_id"),
  repositoryDisplay: text("repository_display"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ClanRunProjectionRow = typeof clanRunProjections.$inferSelect;
export type ClanRunProjectionInsert = typeof clanRunProjections.$inferInsert;
