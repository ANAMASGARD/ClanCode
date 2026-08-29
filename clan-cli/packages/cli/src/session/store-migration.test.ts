import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listSessions, resolveMappingById } from "./store.ts";

describe("session store migration", () => {
  test("persists stable id for legacy rows without id", async () => {
    const previous = process.env.XDG_STATE_HOME;
    const stateHome = join("/tmp", `clancode-legacy-${crypto.randomUUID()}`);
    process.env.XDG_STATE_HOME = stateHome;
    try {
      await mkdir(join(stateHome, "clancode"), { recursive: true });
      await writeFile(
        join(stateHome, "clancode", "sessions.json"),
        JSON.stringify([
          {
            key: "repo::plan::model",
            repositoryIdentity: "repo",
            agentProfile: "plan",
            model: "model",
            trueforgeSessionId: "sess_legacy",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      );
      const first = await listSessions();
      expect(first).toHaveLength(1);
      expect(first[0]?.id).toBeDefined();
      const id = first[0]!.id;
      const second = await listSessions();
      expect(second[0]?.id).toBe(id);
      const resolved = await resolveMappingById(id);
      expect(resolved?.trueforgeSessionId).toBe("sess_legacy");
    } finally {
      if (previous === undefined) {
        delete process.env.XDG_STATE_HOME;
      } else {
        process.env.XDG_STATE_HOME = previous;
      }
    }
  });
});
