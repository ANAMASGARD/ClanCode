import { spawn, type ChildProcess } from "node:child_process";
import { TrueForge } from "@truefoundry/trueforge-sdk";
import type { TrueforgeConfig } from "./config.js";

const ATTACH_PROBE_TIMEOUT_MS = 2_000;
const STOP_TIMEOUT_MS = 5_000;
const HEALTH_POLL_INTERVAL_MS = 250;
const STDERR_CAPTURE_LIMIT_BYTES = 16_384;

export class TrueforgeHealthError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TrueforgeHealthError";
  }
}

export type TrueforgeRuntimeHandle =
  | { mode: "attached"; baseUrl: string }
  | { mode: "spawned"; baseUrl: string; child: ChildProcess };

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    throw new Error("Health check aborted", { cause: signal.reason });
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(new Error("Health check aborted", { cause: signal?.reason }));
    };

    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
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
  signal?: AbortSignal,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    if (signal?.aborted) {
      throw new TrueforgeHealthError("Health check aborted", {
        cause: signal.reason,
      });
    }

    const remainingMs = deadline - Date.now();
    const controller = new AbortController();
    const requestTimeout = setTimeout(() => controller.abort(), remainingMs);

    const abortFromParent = () => controller.abort();
    signal?.addEventListener("abort", abortFromParent, { once: true });

    try {
      const response = await fetch(`${baseUrl}/healthz`, {
        signal: controller.signal,
      });
      const body = await response.text();
      if (response.ok && body.includes("OK")) {
        return;
      }
      lastError = new Error(
        `Unexpected /healthz response: ${String(response.status)} ${body}`,
      );
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(requestTimeout);
      signal?.removeEventListener("abort", abortFromParent);
    }

    if (Date.now() >= deadline) {
      break;
    }

    await sleep(
      Math.min(HEALTH_POLL_INTERVAL_MS, deadline - Date.now()),
      signal,
    );
  }

  throw new TrueforgeHealthError(
    `TrueForge did not become healthy at ${baseUrl} within ${String(timeoutMs)}ms`,
    { cause: lastError },
  );
}

type SpawnedTrueforge = {
  child: ChildProcess;
  stderr: () => string;
  spawnError: Promise<never>;
};

function spawnTrueforgeServer(config: TrueforgeConfig): SpawnedTrueforge {
  let stderrBytes = 0;
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

  const spawnError = new Promise<never>((_, reject) => {
    child.once("error", (error) => {
      reject(
        new Error(
          `Failed to start TrueForge with ${config.nodeBin}: ${error.message}`,
          { cause: error },
        ),
      );
    });
  });

  child.stderr?.on("data", (chunk: Buffer | string) => {
    const text = String(chunk);
    const nextBytes = stderrBytes + text.length;
    if (nextBytes <= STDERR_CAPTURE_LIMIT_BYTES) {
      stderrChunks.push(text);
      stderrBytes = nextBytes;
      return;
    }

    const remaining = STDERR_CAPTURE_LIMIT_BYTES - stderrBytes;
    if (remaining > 0) {
      stderrChunks.push(text.slice(0, remaining));
      stderrBytes = STDERR_CAPTURE_LIMIT_BYTES;
    }
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

  return {
    child,
    stderr: () => stderrChunks.join("").trim(),
    spawnError,
  };
}

async function waitForHealthySpawn(
  spawned: SpawnedTrueforge,
  config: TrueforgeConfig,
): Promise<ChildProcess> {
  try {
    await Promise.race([
      waitForHealth(config.baseUrl, config.startTimeoutMs),
      spawned.spawnError,
    ]);
    return spawned.child;
  } catch (error) {
    if (spawned.child.exitCode === null) {
      spawned.child.kill("SIGKILL");
      await waitForExit(spawned.child, STOP_TIMEOUT_MS);
    }

    if (spawned.stderr().length > 0 && error instanceof Error) {
      throw new Error(`${error.message}\nTrueForge stderr:\n${spawned.stderr()}`, {
        cause: error,
      });
    }

    throw error;
  }
}

export async function ensureRuntime(
  config: TrueforgeConfig,
  signal?: AbortSignal,
): Promise<TrueforgeRuntimeHandle> {
  try {
    await waitForHealth(config.baseUrl, ATTACH_PROBE_TIMEOUT_MS, signal);
    return { mode: "attached", baseUrl: config.baseUrl };
  } catch {
    // Not already running — spawn a local standalone server.
  }

  const spawned = spawnTrueforgeServer(config);
  const child = await waitForHealthySpawn(spawned, config);

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
  if (child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");
  await waitForExit(child, STOP_TIMEOUT_MS);

  if (child.exitCode === null) {
    child.kill("SIGKILL");
    await waitForExit(child, STOP_TIMEOUT_MS);
  }
}
