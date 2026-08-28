import { spawn, type ChildProcess } from "node:child_process";
import { TrueForge } from "@truefoundry/trueforge-sdk";
import type { TrueforgeConfig } from "./config.js";

const ATTACH_PROBE_TIMEOUT_MS = 2_000;
const STOP_TIMEOUT_MS = 5_000;
const HEALTH_POLL_INTERVAL_MS = 250;

export type TrueforgeRuntimeHandle =
  | { mode: "attached"; baseUrl: string }
  | { mode: "spawned"; baseUrl: string; child: ChildProcess };

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForExit(
  child: ChildProcess,
  timeoutMs: number,
): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      child.removeListener("exit", onExit);
      resolve();
    }, timeoutMs);

    const onExit = () => {
      clearTimeout(timer);
      resolve();
    };

    child.once("exit", onExit);
  });
}

export async function waitForHealth(
  baseUrl: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      const body = await response.text();
      if (response.ok && body.includes("OK")) {
        return;
      }
      lastError = new Error(
        `Unexpected /healthz response: ${String(response.status)} ${body}`,
      );
    } catch (error) {
      lastError = error;
    }

    await sleep(HEALTH_POLL_INTERVAL_MS);
  }

  throw new Error(
    `TrueForge did not become healthy at ${baseUrl} within ${String(timeoutMs)}ms`,
    { cause: lastError },
  );
}

function spawnTrueforgeServer(config: TrueforgeConfig): ChildProcess {
  const stderrChunks: string[] = [];

  const child = spawn(
    config.nodeBin,
    [config.cliPath, "--port", String(config.port)],
    {
      env: {
        ...process.env,
        PORT: String(config.port),
        STANDALONE: "true",
      },
      stdio: ["ignore", "ignore", "pipe"],
    },
  );

  child.stderr?.on("data", (chunk: Buffer | string) => {
    stderrChunks.push(String(chunk));
  });

  child.once("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      const stderr = stderrChunks.join("").trim();
      const detail =
        stderr.length > 0 ? `\nTrueForge stderr:\n${stderr}` : "";
      console.error(
        `TrueForge exited before becoming healthy (code=${String(code)}, signal=${String(signal)})${detail}`,
      );
    }
  });

  return child;
}

export async function ensureRuntime(
  config: TrueforgeConfig,
): Promise<TrueforgeRuntimeHandle> {
  try {
    await waitForHealth(config.baseUrl, ATTACH_PROBE_TIMEOUT_MS);
    return { mode: "attached", baseUrl: config.baseUrl };
  } catch {
    // Not already running — spawn a local standalone server.
  }

  const child = spawnTrueforgeServer(config);

  try {
    await waitForHealth(config.baseUrl, config.startTimeoutMs);
  } catch (error) {
    if (!child.killed && child.exitCode === null) {
      child.kill("SIGKILL");
    }
    throw error;
  }

  return { mode: "spawned", baseUrl: config.baseUrl, child };
}

export async function verifySdkConnection(
  baseUrl: string,
  timeoutInSeconds: number,
): Promise<unknown> {
  const client = new TrueForge({
    baseUrl,
    timeoutInSeconds,
  });

  return await client.auth.me();
}

export async function stopRuntime(
  handle: TrueforgeRuntimeHandle,
): Promise<void> {
  if (handle.mode === "attached") {
    return;
  }

  const { child } = handle;
  if (child.killed || child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");
  await waitForExit(child, STOP_TIMEOUT_MS);

  if (child.exitCode === null && !child.killed) {
    child.kill("SIGKILL");
    await waitForExit(child, STOP_TIMEOUT_MS);
  }
}
