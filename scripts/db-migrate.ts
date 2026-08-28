import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Add your Neon connection string to .env.local.",
  );
}

const db = drizzle({ client: neon(url) });

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations complete.");
