CREATE INDEX IF NOT EXISTS "clan_run_session_logs_user_archived_idx"
  ON "clan_run_session_logs" ("clerk_user_id", "archived_at" DESC);
