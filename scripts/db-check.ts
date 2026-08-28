import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });

const { getDb } = await import("../app/lib/db/index");

const result = await getDb().execute(sql`select 'hello world' as text`);
console.log(result.rows);
