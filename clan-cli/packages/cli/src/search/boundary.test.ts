import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveRepository } from "../repository/repository.ts";
import { grepTool } from "../tools/read.ts";
import { searchWithGitFallback } from "./fallback.ts";
import { isRipgrepAvailable, searchWithRipgrep } from "./ripgrep.ts";

async function makeRepo(): Promise<string> {
  const root = join(tmpdir(), `clan-search-${crypto.randomUUID()}`);
  await mkdir(root, { recursive: true });
  Bun.spawnSync(["git", "init"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.email", "test@example.com"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.name", "Test"], { cwd: root });
  await writeFile(join(root, "inside.txt"), "INSIDE_ONLY\n");
  Bun.spawnSync(["git", "add", "."], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
  return root;
}

describe("search boundary", () => {
  const roots: string[] = [];
  afterAll(() => {
    for (const root of roots) {
      Bun.spawnSync(["rm", "-rf", "--", root]);
    }
  });

  test("grep rejects path traversal outside repository", async () => {
    const root = await makeRepo();
    roots.push(root);
    const repo = await resolveRepository(root);
    const result = await grepTool(repo, "INSIDE_ONLY", { path: "../" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("search_failed");
    }
  });

  test("fallback ignores tracked symlink escape", async () => {
    const root = await makeRepo();
    roots.push(root);
    const outside = join(tmpdir(), `clan-search-out-${crypto.randomUUID()}`);
    await mkdir(outside, { recursive: true });
    await writeFile(join(outside, "leak.txt"), "SYMLINK_SECRET\n");
    roots.push(outside);
    await symlink(join(outside, "leak.txt"), join(root, "link.txt"));
    Bun.spawnSync(["git", "add", "link.txt"], { cwd: root });
    Bun.spawnSync(["git", "commit", "-m", "link"], { cwd: root });
    const repo = await resolveRepository(root);
    const result = await searchWithGitFallback(repo, { pattern: "SYMLINK_SECRET" });
    expect(result.matches.length).toBe(0);
  });

  test("ripgrep regex search works when rg is installed", async () => {
    if (!(await isRipgrepAvailable())) {
      return;
    }
    const root = await makeRepo();
    roots.push(root);
    const repo = await resolveRepository(root);
    const result = await searchWithRipgrep(repo, { pattern: "INSIDE_.*" });
    expect(result.matches.some((m) => m.path.endsWith("inside.txt"))).toBe(true);
  });
});
