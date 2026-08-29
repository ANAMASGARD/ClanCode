import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveRepository } from "../repository/repository.ts";
import { createTaskWorktree } from "../worktree/manager.ts";
import {
  findResumeMapping,
  invalidateMapping,
  saveMapping,
  sessionKey,
} from "../session/store.ts";

async function makeRepo(): Promise<string> {
  const root = join(tmpdir(), `clan-resume-${crypto.randomUUID()}`);
  await mkdir(root, { recursive: true });
  Bun.spawnSync(["git", "init"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.email", "t@example.com"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.name", "T"], { cwd: root });
  await writeFile(join(root, "disposable.txt"), "remove me\n");
  Bun.spawnSync(["git", "add", "."], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
  return root;
}

describe("build session resume metadata", () => {
  const roots: string[] = [];
  afterAll(() => {
    for (const root of roots) {
      Bun.spawnSync(["rm", "-rf", "--", root]);
    }
  });

  test("primary-repo mapping survives worktree identity change", async () => {
    const previous = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = `/tmp/clancode-session-${crypto.randomUUID()}`;
    try {
      const root = await makeRepo();
      roots.push(root);
      const primary = await resolveRepository(root);
      const worktree = await createTaskWorktree(primary, "approval-resume");
      const workRepo = await resolveRepository(worktree.worktreePath);
      expect(workRepo.identity).not.toBe(primary.identity);

      const model = "test/model";
      const key = sessionKey({
        repositoryIdentity: primary.identity,
        agentProfile: "build",
        model,
      });
      await saveMapping({
        key,
        repositoryIdentity: primary.identity,
        agentProfile: "build",
        model,
        trueforgeSessionId: "sess_resume_1",
        worktreePath: worktree.worktreePath,
        branchName: worktree.branchName,
        baseCommit: worktree.baseCommit,
        pendingApprovals: [
          {
            threadId: "thread_resume",
            toolCallId: "call_delete",
            toolName: "delete_file",
            summary: '{"path":"disposable.txt"}',
            cwd: worktree.worktreePath,
            risk: "DELETE",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const fromPrimary = await findResumeMapping({
        repositoryIdentity: primary.identity,
        model,
      });
      expect(fromPrimary?.worktreePath).toBe(worktree.worktreePath);
      expect(fromPrimary?.pendingApprovals?.length).toBe(1);

      const fromWorktreeLookup = await findResumeMapping({
        repositoryIdentity: workRepo.identity,
        model,
      });
      expect(fromWorktreeLookup).toBeUndefined();

      await invalidateMapping(key);
    } finally {
      if (previous === undefined) {
        delete process.env.XDG_STATE_HOME;
      } else {
        process.env.XDG_STATE_HOME = previous;
      }
    }
  });
});
