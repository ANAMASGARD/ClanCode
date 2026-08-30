import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const clanLayouts = pgTable("clan_layouts", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  placements: jsonb("placements").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ClanLayoutRow = typeof clanLayouts.$inferSelect;
export type ClanLayoutInsert = typeof clanLayouts.$inferInsert;
