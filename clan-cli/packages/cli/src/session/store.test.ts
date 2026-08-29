import { describe, expect, test } from "bun:test";
import {
  findResumeMapping,
  invalidateMapping,
  saveMapping,
  sessionKey,
} from "./store.ts";

describe("session mapping", () => {
  test("keys by primary identity+profile+model and finds pending resume", async () => {
    const previous = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = `/tmp/clancode-session-${crypto.randomUUID()}`;
    try {
      const primaryIdentity = "git@example.com:org/repo.git::/tmp/primary";
      const key = sessionKey({
        repositoryIdentity: primaryIdentity,
        agentProfile: "build",
        model: "openai/gpt-test",
      });
      await saveMapping({
        id: "sess-local-1",
        key,
        repositoryIdentity: primaryIdentity,
        agentProfile: "build",
        model: "openai/gpt-test",
        trueforgeSessionId: "sess_1",
        worktreePath: "/tmp/worktree-abc",
        branchName: "clancode/build-deadbeef",
        baseCommit: "abc123",
        pendingApprovals: [
          {
            threadId: "thread_1",
            toolCallId: "call_1",
            toolName: "delete_file",
            summary: '{"path":"tmp.txt"}',
            risk: "DELETE",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const found = await findResumeMapping({
        repositoryIdentity: primaryIdentity,
        model: "openai/gpt-test",
      });
      expect(found?.trueforgeSessionId).toBe("sess_1");
      expect(found?.worktreePath).toBe("/tmp/worktree-abc");
      expect(found?.pendingApprovals?.[0]?.toolName).toBe("delete_file");
      await invalidateMapping(key);
      expect(
        await findResumeMapping({
          repositoryIdentity: primaryIdentity,
          model: "openai/gpt-test",
        }),
      ).toBeUndefined();
    } finally {
      if (previous === undefined) {
        delete process.env.XDG_STATE_HOME;
      } else {
        process.env.XDG_STATE_HOME = previous;
      }
    }
  });
});
