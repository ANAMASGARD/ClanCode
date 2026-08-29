import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { RunEvent } from "@clancode/protocol";
import { RunSupervisor } from "../src/supervisor/supervisor.ts";

async function makeRepo(): Promise<string> {
  const root = join(tmpdir(), `clan-approval-${crypto.randomUUID()}`);
  await mkdir(root, { recursive: true });
  Bun.spawnSync(["git", "init"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.email", "t@example.com"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.name", "T"], { cwd: root });
  await writeFile(join(root, "disposable.txt"), "delete-me\n");
  Bun.spawnSync(["git", "add", "."], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
  return root;
}

function hasApprovalRequired(events: RunEvent[]): boolean {
  return events.some((event) => event.type === "approval.required");
}

async function main(): Promise<void> {
  const root = await makeRepo();
  const events: RunEvent[] = [];
  const supervisor = new RunSupervisor();
  supervisor.subscribe((event) => {
    events.push(event);
  });
  try {
    await supervisor.start(root);
    await supervisor.setMode("build");
    const workRoot = supervisor.repo?.root ?? root;
    const disposable = join(workRoot, "disposable.txt");
    await supervisor.submitMessage(
      "Delete the file disposable.txt using the delete_file tool. Do not use shell commands.",
    );
    if (supervisor.status() !== "awaiting_approval") {
      throw new Error(
        `Expected awaiting_approval after delete request, got ${supervisor.status()}`,
      );
    }
    if (!hasApprovalRequired(events)) {
      throw new Error("Expected approval.required event");
    }
    if (!existsSync(disposable)) {
      throw new Error("Delete happened before approval");
    }

    await supervisor.resolveApproval(false);
    if (!existsSync(disposable)) {
      throw new Error("Denied delete still removed the file");
    }

    events.length = 0;
    await supervisor.submitMessage(
      "Delete disposable.txt with delete_file now.",
    );
    if (supervisor.status() !== "awaiting_approval") {
      throw new Error("Expected second approval pause");
    }
    await supervisor.resolveApproval(true);
    if (existsSync(disposable)) {
      throw new Error("Approved delete did not remove the file");
    }
    const duplicateDeletes = events.filter(
      (event) =>
        event.type === "tool.completed" &&
        JSON.stringify(event.payload).includes("disposable.txt"),
    );
    if (duplicateDeletes.length !== 1) {
      throw new Error("Expected exactly one successful delete tool completion");
    }
    console.log("approval smoke: PASS");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/No TrueForge model|model provider|CLAN_TRUEFORGE_MODEL/i.test(message)) {
      console.error("BLOCKED: approval smoke requires a configured TrueForge model provider");
      process.exitCode = 2;
      return;
    }
    console.error("Approval smoke failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await supervisor.stop();
    Bun.spawnSync(["rm", "-rf", "--", root]);
  }
}

await main();
