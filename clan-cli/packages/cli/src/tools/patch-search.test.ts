import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveRepository } from "../repository/repository.ts";
import { applyPatch } from "./write.ts";
import { grepTool } from "./read.ts";

describe("apply_patch", () => {
  test("ambiguous when multiple matches", async () => {
    const root = join(tmpdir(), `clan-patch-${crypto.randomUUID()}`);
    await mkdir(root, { recursive: true });
    Bun.spawnSync(["git", "init"], { cwd: root });
    await writeFile(join(root, "a.txt"), "foo\nfoo\n");
    const repo = await resolveRepository(root);
    const result = await applyPatch(repo, "a.txt", "foo", "bar");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ambiguous");
    }
    Bun.spawnSync(["rm", "-rf", "--", root]);
  });

  test("replaceAll replaces all occurrences", async () => {
    const root = join(tmpdir(), `clan-patch-${crypto.randomUUID()}`);
    await mkdir(root, { recursive: true });
    Bun.spawnSync(["git", "init"], { cwd: root });
    await writeFile(join(root, "a.txt"), "foo\nfoo\n");
    const repo = await resolveRepository(root);
    const result = await applyPatch(repo, "a.txt", "foo", "bar", true);
    expect(result.ok).toBe(true);
    Bun.spawnSync(["rm", "-rf", "--", root]);
  });
});

describe("grep polyglot", () => {
  test("finds marker in python via git ls-files fallback or rg", async () => {
    const root = join(tmpdir(), `clan-grep-${crypto.randomUUID()}`);
    await mkdir(root, { recursive: true });
    Bun.spawnSync(["git", "init"], { cwd: root });
    Bun.spawnSync(["git", "config", "user.email", "t@example.com"], { cwd: root });
    Bun.spawnSync(["git", "config", "user.name", "T"], { cwd: root });
    await writeFile(join(root, "marker.py"), "FEATURE_MARKER = 42\n");
    Bun.spawnSync(["git", "add", "."], { cwd: root });
    Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
    const repo = await resolveRepository(root);
    const result = await grepTool(repo, "FEATURE_MARKER");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.matches.some((m) => m.path.endsWith("marker.py"))).toBe(true);
    }
    Bun.spawnSync(["rm", "-rf", "--", root]);
  });
});
