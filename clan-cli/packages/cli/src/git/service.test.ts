import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertTaskBranch, createGitService } from "./service.ts";

async function makeRepo(): Promise<string> {
  const root = join(tmpdir(), `clan-git-${crypto.randomUUID()}`);
  await mkdir(root, { recursive: true });
  Bun.spawnSync(["git", "init"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.email", "test@example.com"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.name", "Test"], { cwd: root });
  await writeFile(join(root, "README.md"), "hello\n");
  Bun.spawnSync(["git", "add", "."], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
  return root;
}

describe("git delivery guards", () => {
  const roots: string[] = [];
  afterAll(() => {
    for (const root of roots) {
      Bun.spawnSync(["rm", "-rf", "--", root]);
    }
  });

  test("refuses default and non-task branches", () => {
    expect(() => assertTaskBranch("main", "main")).toThrow();
    expect(() => assertTaskBranch("feature", "main")).toThrow();
    expect(() => assertTaskBranch("clancode/fix-abc123", "main")).not.toThrow();
  });

  test("commit never stages protected secret paths", async () => {
    const root = await makeRepo();
    roots.push(root);
    await writeFile(join(root, "app.ts"), "export const n = 1;\n");
    await writeFile(join(root, ".env"), "SECRET=should-not-commit\n");
    const git = createGitService();
    await git.commit(root, "safe change");
    const show = Bun.spawnSync(["git", "show", "--name-only", "--pretty=format:"], {
      cwd: root,
      stdout: "pipe",
    });
    const names = show.stdout.toString();
    expect(names).toContain("app.ts");
    expect(names).not.toContain(".env");
  });
});
