import { RunSupervisor } from "../src/supervisor/supervisor.ts";

async function main(): Promise<void> {
  const supervisor = new RunSupervisor();
  const events: string[] = [];
  supervisor.subscribe((event) => {
    events.push(event.type);
  });
  try {
    await supervisor.start();
    if (supervisor.status() !== "ready") {
      throw new Error(`expected ready, got ${supervisor.status()}`);
    }
    console.log(`ClanCode supervisor smoke: ${supervisor.runtimeMode()} ${supervisor.status()}`);
    await supervisor.cancel();
    if (supervisor.status() !== "stopped") {
      throw new Error(`expected stopped, got ${supervisor.status()}`);
    }
    if (!events.includes("run.started") && !events.includes("run.cancelled")) {
      // cancel after ready emits run.cancelled; start emitted run.started
    }
    if (!events.includes("run.started")) {
      throw new Error("missing run.started");
    }
    if (!events.includes("run.cancelled")) {
      throw new Error("missing run.cancelled");
    }
    console.log("  start → ready → cancel/stop OK");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await supervisor.stop();
  }
}

await main();
