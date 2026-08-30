import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type ArchivedActivityLine = {
  id: string;
  kind: "user" | "system";
  text: string;
  href?: string;
};

export const clanRunSessionLogs = pgTable("clan_run_session_logs", {
  id: text("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  runId: text("run_id"),
  promptPreview: text("prompt_preview"),
  phase: text("phase"),
  repositoryDisplay: text("repository_display"),
  prUrl: text("pr_url"),
  activity: jsonb("activity").notNull().$type<ArchivedActivityLine[]>().default([]),
  archivedAt: timestamp("archived_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ClanRunSessionLogRow = typeof clanRunSessionLogs.$inferSelect;
