import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveRepository } from "./repository/repository.ts";
import { executeTool } from "./tools/registry.ts";
import { createTaskWorktree } from "./worktree/manager.ts";
import { runCommand, sanitizeEnv } from "./process/runner.ts";

async function makeApp(): Promise<string> {
  const root = join(tmpdir(), `clan-e2e-${crypto.randomUUID()}`);
  await mkdir(root, { recursive: true });
  Bun.spawnSync(["git", "init"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.email", "t@example.com"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.name", "T"], { cwd: root });
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ name: "sample", scripts: { test: "bun test" } }, null, 2),
  );
  await writeFile(join(root, "sum.js"), "export function sum(a, b) { return a - b }\n");
  await writeFile(
    join(root, "sum.test.js"),
    `import { expect, test } from "bun:test";
import { sum } from "./sum.js";
test("adds", () => { expect(sum(1, 2)).toBe(3); });
`,
  );
  Bun.spawnSync(["git", "add", "."], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
  return root;
}

describe("local harness without model", () => {
  test("plan is read-only, build uses worktree, tests actually run", async () => {
    const root = await makeApp();
    const repo = await resolveRepository(root);
    const failing = await runCommand({
      command: "bun",
      args: ["test"],
      cwd: root,
      timeoutMs: 20_000,
      maxStdoutBytes: 16_000,
      maxStderrBytes: 16_000,
      env: sanitizeEnv(undefined),
      authorizedRoot: root,
    });
    expect(failing.exitCode === 0).toBe(false);

    const planWrite = await executeTool(
      { repo, mode: "plan", deleteApproved: false, commandApproved: false },
      "write_file",
      { path: "sum.js", content: "export function sum(a, b) { return a + b }\n" },
    );
    expect(planWrite.ok).toBe(false);

    const worktree = await createTaskWorktree(repo, "fix-test");
    const workRepo = await resolveRepository(worktree.worktreePath);
    const written = await executeTool(
      { repo: workRepo, mode: "build", deleteApproved: false, commandApproved: false },
      "write_file",
      { path: "sum.js", content: "export function sum(a, b) { return a + b }\n" },
    );
    expect(written.ok).toBe(true);

    const primary = await Bun.file(join(root, "sum.js")).text();
    expect(primary).toContain("a - b");

    const passing = await runCommand({
      command: "bun",
      args: ["test"],
      cwd: worktree.worktreePath,
      timeoutMs: 20_000,
      maxStdoutBytes: 16_000,
      maxStderrBytes: 16_000,
      env: sanitizeEnv(undefined),
      authorizedRoot: worktree.worktreePath,
    });
    expect(passing.exitCode).toBe(0);
    expect(passing.timedOut).toBe(false);

    const ssh = await executeTool(
      { repo: workRepo, mode: "plan", deleteApproved: false, commandApproved: false },
      "read_file",
      { path: `${process.env.HOME}/.ssh/id_rsa` },
    );
    expect(ssh.ok).toBe(false);

    Bun.spawnSync(["rm", "-rf", "--", root]);
  });
});
