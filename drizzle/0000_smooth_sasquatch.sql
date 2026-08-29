CREATE TYPE "public"."device_status" AS ENUM('pending', 'active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."pairing_challenge_status" AS ENUM('pending', 'approved', 'consumed', 'expired', 'denied');--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"label" text NOT NULL,
	"platform" text,
	"token_hash" text NOT NULL,
	"status" "device_status" DEFAULT 'pending' NOT NULL,
	"connection_state" text DEFAULT 'offline' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "devices_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "pairing_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_code" text NOT NULL,
	"device_code_hash" text NOT NULL,
	"hostname" text,
	"platform" text,
	"status" "pairing_challenge_status" DEFAULT 'pending' NOT NULL,
	"clerk_user_id" text,
	"device_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"last_poll_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pairing_challenges_user_code_unique" UNIQUE("user_code")
);
--> statement-breakpoint
CREATE TABLE "pairing_deliveries" (
	"challenge_id" uuid PRIMARY KEY NOT NULL,
	"iv" text NOT NULL,
	"ciphertext" text NOT NULL,
	"auth_tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pairing_challenges" ADD CONSTRAINT "pairing_challenges_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_deliveries" ADD CONSTRAINT "pairing_deliveries_challenge_id_pairing_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."pairing_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "devices_clerk_user_id_idx" ON "devices" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "devices_token_hash_idx" ON "devices" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "pairing_challenges_user_code_idx" ON "pairing_challenges" USING btree ("user_code");--> statement-breakpoint
CREATE INDEX "pairing_challenges_device_code_hash_idx" ON "pairing_challenges" USING btree ("device_code_hash");