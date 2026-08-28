import { RunSupervisor } from "../supervisor/supervisor.ts";
import { formatDoctor, runDoctor } from "../doctor/doctor.ts";
import { startInteractiveUi } from "./tui.tsx";
import type { AgentMode } from "../tools/registry.ts";

const VERSION = "0.1.0";

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
        return 3;
      }
      return supervisor.status() === "failed" ? 1 : 0;
    } finally {
      await supervisor.stop();
    }
  }

  await startInteractiveUi({ repo: flagValue(args, "--repo") });
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
  clancode                       Interactive OpenTUI harness
  clancode run "task"            Headless run (same supervisor)
  clancode run --mode build "t"  Headless Build mode (isolated worktree)
  clancode doctor [--json]       Diagnostics (never prints secrets)
  clancode --version
  clancode --help
`);
}
