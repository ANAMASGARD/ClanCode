import { RunSupervisor } from "../supervisor/supervisor.ts";
import { formatDoctor, runDoctor } from "../doctor/doctor.ts";
import { startInteractiveUi } from "./tui.tsx";
import { runConnectCommand } from "./connect.ts";
import { runLoginCommand, ensureDevicePaired } from "../pairing/login.ts";
import type { AgentMode } from "../tools/registry.ts";
import { createAgentClient } from "../trueforge/agent.ts";
import { loadTrueforgeConfig } from "../trueforge/config.ts";
import { ensureRuntime } from "../trueforge/runtime.ts";
import { assertNodeRuntime } from "../trueforge/config.ts";
import { listAvailableModels, selectModel } from "../models/resolve.ts";

const VERSION = "0.1.0-beta.1";

export async function runCli(argv: readonly string[]): Promise<number> {
  const args = argv.slice(2);
  if (args[0] === "--version" || args[0] === "-v") {
    console.log(VERSION);
    return 0;
  }
  if (args[0] === "--help" || args[0] === "-h" || args[0] === "help") {
    printHelp();
    return 0;
  }
  if (args[0] === "doctor") {
    const json = args.includes("--json");
    const report = await runDoctor(flagValue(args, "--repo"));
    if (json) {
      console.log(JSON.stringify(report));
    } else {
      console.log(formatDoctor(report));
    }
    return report.ok ? 0 : 1;
  }
  if (args[0] === "connect") {
    return await runConnectCommand();
  }
  if (args[0] === "login" || args[0] === "pair") {
    return await runLoginCommand();
  }
  if (args[0] === "new") {
    const supervisor = new RunSupervisor();
    try {
      await supervisor.start(flagValue(args.slice(1), "--repo"));
      await supervisor.startNewConversation();
      console.log(`New session: ${supervisor.sessionId ?? "none"}`);
      return 0;
    } finally {
      await supervisor.stop();
    }
  }
  if (args[0] === "models") {
    const config = loadTrueforgeConfig();
    assertNodeRuntime(config.nodeBin);
    const handle = await ensureRuntime(config);
    const client = createAgentClient(config);
    try {
      const models = await listAvailableModels(client);
      for (const name of models) {
        console.log(name);
      }
      return 0;
    } finally {
      if (handle.mode === "spawned") {
        const { stopRuntime } = await import("../trueforge/runtime.ts");
        await stopRuntime(handle);
      }
    }
  }
  if (args[0] === "model") {
    const name = args[1];
    if (name === undefined || name.length === 0) {
      console.error("Usage: clancode model <name>");
      return 2;
    }
    const config = loadTrueforgeConfig();
    assertNodeRuntime(config.nodeBin);
    const handle = await ensureRuntime(config);
    const client = createAgentClient(config);
    try {
      await selectModel(client, name);
      console.log(`Preferred model set to ${name}`);
      return 0;
    } finally {
      if (handle.mode === "spawned") {
        const { stopRuntime } = await import("../trueforge/runtime.ts");
        await stopRuntime(handle);
      }
    }
  }
  if (args[0] === "run") {
    const rest = args.slice(1);
    const repo = flagValue(rest, "--repo");
    const mode = parseMode(flagValue(rest, "--mode"));
    const task = positionalArgs(rest).join(" ");
    if (task.trim().length === 0) {
      console.error('Usage: clancode run "task"');
      return 2;
    }
    const supervisor = new RunSupervisor();
    try {
      await supervisor.start(repo);
      if (mode === "build") {
        await supervisor.setMode("build");
      }
      await supervisor.submitMessage(task);
      if (supervisor.lastModelText.length > 0) {
        console.log(supervisor.lastModelText);
      }
      if (supervisor.status() === "awaiting_approval") {
        console.error(
          "Run paused for approval. Start interactive `clancode`, then /resume and /approve or /deny.",
        );
        await supervisor.detachForApprovalPause();
        return 3;
      }
      return supervisor.status() === "failed" ? 1 : 0;
    } finally {
      if (supervisor.status() !== "awaiting_approval" && supervisor.status() !== "stopped") {
        await supervisor.stop();
      }
    }
  }

  if (args.includes("--offline")) {
    await startInteractiveUi({ repo: flagValue(args, "--repo"), controlPlane: false });
    return 0;
  }

  const pairCode = await ensureDevicePaired();
  if (pairCode !== 0) {
    return pairCode;
  }

  await startInteractiveUi({ repo: flagValue(args, "--repo"), controlPlane: true });
  return 0;
}

function parseMode(value: string | undefined): AgentMode {
  if (value === "build") {
    return "build";
  }
  return "plan";
}

function flagValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function positionalArgs(args: readonly string[]): string[] {
  const skip = new Set(["--repo", "--mode"]);
  const out: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === undefined) {
      continue;
    }
    if (skip.has(arg)) {
      i += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      continue;
    }
    out.push(arg);
  }
  return out;
}

function printHelp(): void {
  console.log(`clancode ${VERSION}

Usage:
  clancode                       Interactive OpenTUI harness (pairs once, then auto-connects)
  clancode --offline             Skip web pairing/connect and run local harness only
  clancode run "task"            Headless run (same supervisor)
  clancode run --mode build "t"  Headless Build mode (isolated worktree)
  clancode connect                 Outbound control-plane connection
  clancode login                   Pair (or re-pair) this laptop with the web control plane
  clancode pair                    Alias for clancode login
  clancode new [--repo PATH]       Start a fresh TrueForge session
  clancode models                  List TrueForge models
  clancode model <name>            Set preferred model
  clancode doctor [--json]       Diagnostics (never prints secrets)
  clancode --version
  clancode --help
`);
}
