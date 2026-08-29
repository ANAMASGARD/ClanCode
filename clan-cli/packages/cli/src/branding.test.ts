import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("ClanCode branding", () => {
  test("no stale @clanofagents imports in cli or protocol src", () => {
    const roots = [
      join(import.meta.dir),
      join(import.meta.dir, "../../protocol/src"),
    ];
    for (const root of roots) {
      const files = readdirSync(root, { recursive: true }) as string[];
      for (const file of files) {
        if (!file.endsWith(".ts") && !file.endsWith(".tsx")) {
          continue;
        }
        if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) {
          continue;
        }
        const content = readFileSync(join(root, file), "utf8");
        expect(/@clanofagents/.test(content)).toBe(false);
      }
    }
  });
});
