import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveRepository } from "../repository/repository.ts";
import { RunSupervisor } from "./supervisor.ts";
import { saveMapping, sessionKey } from "../session/store.ts";

async function makeRepo(name: string): Promise<string> {
  const root = join(tmpdir(), name);
  await mkdir(root, { recursive: true });
  Bun.spawnSync(["git", "init"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.email", "t@example.com"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.name", "T"], { cwd: root });
  await writeFile(join(root, "README.md"), `${name}\n`);
  Bun.spawnSync(["git", "add", "."], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
  return root;
}

describe("resumeStoredSession repository boundary", () => {
  test("explicit id from another repository is rejected", async () => {
    const previous = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = join("/tmp", `clancode-resume-boundary-${crypto.randomUUID()}`);
    const rootA = await makeRepo(`clan-resume-a-${crypto.randomUUID()}`);
    const rootB = await makeRepo(`clan-resume-b-${crypto.randomUUID()}`);
    try {
      const repoA = await resolveRepository(rootA);
      const repoB = await resolveRepository(rootB);
      await saveMapping({
        id: "repo-a-session",
        key: sessionKey({
          repositoryIdentity: repoA.identity,
          agentProfile: "plan",
          model: "test/model",
        }),
        repositoryIdentity: repoA.identity,
        agentProfile: "plan",
        model: "test/model",
        trueforgeSessionId: "sess_a",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const supervisor = new RunSupervisor();
      await supervisor.start(rootB);
      await expect(supervisor.resumeStoredSession("repo-a-session")).rejects.toThrow(
        "Session id belongs to a different repository",
      );
      await supervisor.stop();
    } finally {
      Bun.spawnSync(["rm", "-rf", "--", rootA, rootB]);
      if (previous === undefined) {
        delete process.env.XDG_STATE_HOME;
      } else {
        process.env.XDG_STATE_HOME = previous;
      }
    }
  });
});
