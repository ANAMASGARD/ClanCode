import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveRepository } from "../repository/repository.ts";
import { diffMetadata } from "./write.ts";
import { createGitService } from "../git/service.ts";

async function makeRepo(): Promise<string> {
  const root = join(tmpdir(), `clan-diff-${crypto.randomUUID()}`);
  await mkdir(root, { recursive: true });
  Bun.spawnSync(["git", "init"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.email", "t@example.com"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.name", "T"], { cwd: root });
  await writeFile(join(root, "README.md"), "hello\n");
  Bun.spawnSync(["git", "add", "."], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
  return root;
}

describe("reviewable diff metadata", () => {
  const roots: string[] = [];
  afterAll(() => {
    for (const root of roots) {
      Bun.spawnSync(["rm", "-rf", "--", root]);
    }
  });

  test("untracked file content appears in diff and commit excludes secrets", async () => {
    const root = await makeRepo();
    roots.push(root);
    const repo = await resolveRepository(root);
    const marker = "UNTRACKED_REVIEW_MARKER_42";
    await writeFile(join(root, "new-file.ts"), `export const marker = "${marker}";\n`);
    await writeFile(join(root, ".env"), "SECRET=hidden\n");

    const meta = await diffMetadata(repo);
    expect(meta.paths).toContain("new-file.ts");
    expect(meta.paths).not.toContain(".env");
    expect(meta.diff).toContain("new-file.ts");
    expect(meta.diff).toContain(marker);

    const git = createGitService();
    await git.commit(root, "add reviewed file");
    const show = Bun.spawnSync(["git", "show", "--name-only", "--pretty=format:"], {
      cwd: root,
      stdout: "pipe",
    });
    const names = show.stdout.toString();
    expect(names).toContain("new-file.ts");
    expect(names).not.toContain(".env");
    const blob = Bun.spawnSync(["git", "show", "HEAD:new-file.ts"], {
      cwd: root,
      stdout: "pipe",
    });
    expect(blob.stdout.toString()).toContain(marker);
  });
});
