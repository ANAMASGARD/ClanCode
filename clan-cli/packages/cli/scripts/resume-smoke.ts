import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RunSupervisor } from "../src/supervisor/supervisor.ts";

async function makeRepo(): Promise<string> {
  const root = join(tmpdir(), `clan-resume-smoke-${crypto.randomUUID()}`);
  await mkdir(root, { recursive: true });
  Bun.spawnSync(["git", "init"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.email", "t@example.com"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.name", "T"], { cwd: root });
  await writeFile(join(root, "disposable.txt"), "delete-me\n");
  Bun.spawnSync(["git", "add", "."], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
  return root;
}

async function main(): Promise<void> {
  const root = await makeRepo();
  const disposable = join(root, "disposable.txt");
  const previousState = process.env.XDG_STATE_HOME;
  process.env.XDG_STATE_HOME = join(tmpdir(), `clancode-session-${crypto.randomUUID()}`);
  const first = new RunSupervisor();
  try {
    await first.start(root);
    await first.setMode("build");
    await first.submitMessage(
      "Delete disposable.txt using delete_file. Do not use shell commands.",
    );
    if (first.status() !== "awaiting_approval") {
      throw new Error(`Expected approval pause, got ${first.status()}`);
    }
    await first.detachForApprovalPause();
  } finally {
    // first supervisor detached; do not stop() and wipe mapping
  }

  const second = new RunSupervisor();
  try {
    await second.start(root);
    await second.resumeStoredSession();
    if (second.status() !== "awaiting_approval") {
      throw new Error(`Resume did not restore approval pause: ${second.status()}`);
    }
    if (second.pendingApprovals.length === 0) {
      throw new Error("Resume did not restore pending approvals");
    }
    if (second.worktree === undefined) {
      throw new Error("Resume did not restore build worktree");
    }
    if (!existsSync(disposable)) {
      throw new Error("File deleted before resume/deny");
    }
    await second.resolveApproval(false);
    if (!existsSync(disposable)) {
      throw new Error("Denied delete removed file after resume");
    }
    console.log("resume smoke: PASS");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/No TrueForge model|model provider|CLAN_TRUEFORGE_MODEL/i.test(message)) {
      console.error("BLOCKED: resume smoke requires a configured TrueForge model provider");
      process.exitCode = 2;
      return;
    }
    console.error("Resume smoke failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await second.stop();
    Bun.spawnSync(["rm", "-rf", "--", root]);
    if (previousState === undefined) {
      delete process.env.XDG_STATE_HOME;
    } else {
      process.env.XDG_STATE_HOME = previousState;
    }
  }
}

await main();
