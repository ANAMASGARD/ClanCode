import { describe, expect, test } from "bun:test";
import {
  invalidateMapping,
  listSessions,
  resolveMapping,
  saveMapping,
  sessionKey,
} from "./store.ts";

describe("session mapping", () => {
  test("keys by identity+profile+model and can invalidate", async () => {
    const previous = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = `/tmp/clancode-session-${crypto.randomUUID()}`;
    try {
      const key = sessionKey({
        repositoryIdentity: "git@example.com:org/repo.git::/tmp/repo",
        agentProfile: "plan",
        model: "openai/gpt-test",
      });
      await saveMapping({
        key,
        repositoryIdentity: "git@example.com:org/repo.git::/tmp/repo",
        agentProfile: "plan",
        model: "openai/gpt-test",
        trueforgeSessionId: "sess_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      expect((await resolveMapping(key))?.trueforgeSessionId).toBe("sess_1");
      expect((await listSessions()).length).toBeGreaterThan(0);
      await invalidateMapping(key);
      expect(await resolveMapping(key)).toBeUndefined();
    } finally {
      if (previous === undefined) {
        delete process.env.XDG_STATE_HOME;
      } else {
        process.env.XDG_STATE_HOME = previous;
      }
    }
  });
});
