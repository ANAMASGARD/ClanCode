import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { RunEvent } from "@clancode/protocol";
import { RunSupervisor } from "../src/supervisor/supervisor.ts";

const MARKER = `PLAN_MCP_${crypto.randomUUID()}`;

async function makeRepo(): Promise<string> {
  const root = join(tmpdir(), `clan-plan-mcp-${crypto.randomUUID()}`);
  await mkdir(root, { recursive: true });
  Bun.spawnSync(["git", "init"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.email", "t@example.com"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.name", "T"], { cwd: root });
  await writeFile(join(root, "marker.txt"), `${MARKER}\n`);
  Bun.spawnSync(["git", "add", "."], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
  return root;
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
    await supervisor.submitMessage(
      "You must call the read_file tool on marker.txt before answering. Reply with ONLY the exact file contents and nothing else.",
    );
    const text = supervisor.lastModelText;
    if (!text.includes(MARKER)) {
      throw new Error(`Model output did not include ${MARKER}: ${text.slice(0, 200)}`);
    }
    const toolEvents = events.filter((event) =>
      ["tool.requested", "tool.started", "tool.completed"].includes(event.type),
    );
    const completed = events.some((event) => event.type === "tool.completed");
    if (toolEvents.length === 0 || !completed) {
      throw new Error(
        `Expected MCP tool activity, got events: ${events.map((event) => event.type).join(", ")}`,
      );
    }
    const after = await Bun.file(join(root, "marker.txt")).text();
    if (after.trim() !== MARKER) {
      throw new Error("Plan mode mutated repository unexpectedly");
    }
    console.log("plan mcp smoke: PASS");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/No TrueForge model|model provider|CLAN_TRUEFORGE_MODEL/i.test(message)) {
      console.error("BLOCKED: plan MCP smoke requires a configured TrueForge model provider");
      process.exitCode = 2;
      return;
    }
    console.error("Plan MCP smoke failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await supervisor.stop();
    Bun.spawnSync(["rm", "-rf", "--", root]);
  }
}

await main();
