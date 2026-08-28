import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, realpath, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  RepositoryBoundaryError,
  resolveRepository,
  resolveWithinRepo,
} from "./repository.ts";

async function makeRepo(): Promise<string> {
  const root = join(tmpdir(), `clan-repo-${crypto.randomUUID()}`);
  await mkdir(root, { recursive: true });
  Bun.spawnSync(["git", "init"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.email", "test@example.com"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.name", "Test"], { cwd: root });
  await writeFile(join(root, "README.md"), "hello\n");
  Bun.spawnSync(["git", "add", "."], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
  return root;
}

describe("repository boundary", () => {
  const roots: string[] = [];
  afterAll(() => {
    for (const root of roots) {
      Bun.spawnSync(["rm", "-rf", "--", root]);
    }
  });

  test("valid repo and nested cwd", async () => {
    const root = await makeRepo();
    roots.push(root);
    await mkdir(join(root, "src"), { recursive: true });
    const nested = await resolveRepository(join(root, "src"));
    expect(nested.root).toBe(await realpath(root));
    expect(nested.identity.includes(nested.root)).toBe(true);
    const inside = await resolveWithinRepo(nested, "README.md", { mustExist: true });
    expect(inside.endsWith("README.md")).toBe(true);
  });

  test("non-git directory", async () => {
    const dir = join(tmpdir(), `clan-nongit-${crypto.randomUUID()}`);
    await mkdir(dir, { recursive: true });
    roots.push(dir);
    await expect(resolveRepository(dir)).rejects.toBeInstanceOf(RepositoryBoundaryError);
  });

  test("rejects traversal and foreign absolute path", async () => {
    const root = await makeRepo();
    roots.push(root);
    const repo = await resolveRepository(root);
    await expect(resolveWithinRepo(repo, "../etc/passwd", { mustExist: true })).rejects.toBeInstanceOf(
      RepositoryBoundaryError,
    );
    await expect(resolveWithinRepo(repo, "/etc/passwd", { mustExist: true })).rejects.toBeInstanceOf(
      RepositoryBoundaryError,
    );
  });

  test("rejects symlink escape", async () => {
    const root = await makeRepo();
    roots.push(root);
    const outside = join(tmpdir(), `clan-out-${crypto.randomUUID()}`);
    await mkdir(outside, { recursive: true });
    await writeFile(join(outside, "secret"), "nope");
    roots.push(outside);
    await symlink(join(outside, "secret"), join(root, "link"));
    const repo = await resolveRepository(root);
    await expect(resolveWithinRepo(repo, "link", { mustExist: true })).rejects.toBeInstanceOf(
      RepositoryBoundaryError,
    );
  });

  test("allows nested create paths inside the repo", async () => {
    const root = await makeRepo();
    roots.push(root);
    const repo = await resolveRepository(root);
    const nested = await resolveWithinRepo(repo, "src/new/deep/file.ts");
    expect(nested.endsWith("src/new/deep/file.ts")).toBe(true);
  });

  test("detects dirty repo without mutating it", async () => {
    const root = await makeRepo();
    roots.push(root);
    await writeFile(join(root, "dirty.txt"), "x");
    const repo = await resolveRepository(root);
    expect(repo.dirty).toBe(true);
    const status = Bun.spawnSync(["git", "status", "--porcelain"], { cwd: root, stdout: "pipe" });
    expect(status.stdout.toString()).toContain("dirty.txt");
  });
});
