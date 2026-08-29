import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveRepository } from "../repository/repository.ts";
import { createTaskWorktree } from "./manager.ts";

describe("task worktrees", () => {
  const roots: string[] = [];
  afterAll(() => {
    for (const root of roots) {
      Bun.spawnSync(["rm", "-rf", "--", root]);
    }
  });

  test("preserves dirty user checkout", async () => {
    const root = join(tmpdir(), `clan-wt-${crypto.randomUUID()}`);
    await mkdir(root, { recursive: true });
    roots.push(root);
    Bun.spawnSync(["git", "init"], { cwd: root });
    Bun.spawnSync(["git", "config", "user.email", "t@example.com"], { cwd: root });
    Bun.spawnSync(["git", "config", "user.name", "T"], { cwd: root });
    await writeFile(join(root, "app.js"), "module.exports = 1\n");
    Bun.spawnSync(["git", "add", "."], { cwd: root });
    Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
    await writeFile(join(root, "dirty.txt"), "user work");
    const snapshot = Bun.spawnSync(["git", "status", "--porcelain"], {
      cwd: root,
      stdout: "pipe",
    }).stdout.toString();
    const repo = await resolveRepository(root);
    const worktree = await createTaskWorktree(repo, "fix-test");
    await writeFile(join(worktree.worktreePath, "app.js"), "module.exports = 2\n");
    const after = Bun.spawnSync(["git", "status", "--porcelain"], {
      cwd: root,
      stdout: "pipe",
    }).stdout.toString();
    expect(after).toBe(snapshot);
    expect(worktree.branchName.startsWith("clancode/")).toBe(true);
  });
});
