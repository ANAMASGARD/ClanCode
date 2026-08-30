CREATE TABLE IF NOT EXISTS "clan_run_session_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "clerk_user_id" text NOT NULL,
  "run_id" text,
  "prompt_preview" text,
  "phase" text,
  "repository_display" text,
  "pr_url" text,
  "activity" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "archived_at" timestamp with time zone DEFAULT now() NOT NULL
);
