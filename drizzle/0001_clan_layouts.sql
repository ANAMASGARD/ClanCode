-- Clan plot layout persistence (cosmetic village editor)
CREATE TABLE IF NOT EXISTS "clan_layouts" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"placements" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
