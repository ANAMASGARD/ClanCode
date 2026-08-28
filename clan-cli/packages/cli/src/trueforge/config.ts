import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);

const DEFAULT_PORT = 8790;
const DEFAULT_START_TIMEOUT_MS = 30_000;
const DEFAULT_SDK_TIMEOUT_SECONDS = 30;
const NODE_PREFLIGHT_TIMEOUT_MS = 5_000;
const MIN_NODE_MAJOR = 22;
const MIN_NODE_MINOR = 14;

export type TrueforgeConfig = {
  port: number;
  baseUrl: string;
  startTimeoutMs: number;
  sdkTimeoutSeconds: number;
  nodeBin: string;
  cliPath: string;
};

function parsePort(raw: string | undefined): number {
  if (raw === undefined) {
    return DEFAULT_PORT;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid TRUEFORGE_PORT "${raw}" (expected integer 1–65535)`,
    );
  }
  return port;
}

function parseStartTimeoutMs(raw: string | undefined): number {
  if (raw === undefined) {
    return DEFAULT_START_TIMEOUT_MS;
  }
  const timeoutMs = Number(raw);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error(
      `Invalid TRUEFORGE_START_TIMEOUT_MS "${raw}" (expected positive integer)`,
    );
  }
  return timeoutMs;
}

function assertLoopbackBaseUrl(baseUrl: string): void {
  const hostname = new URL(baseUrl).hostname;
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(
      `TRUEFORGE_BASE_URL must use loopback (localhost or 127.0.0.1); got "${hostname}"`,
    );
  }
}

function portFromBaseUrl(baseUrl: string): number {
  const url = new URL(baseUrl);
  if (url.port.length > 0) {
    return Number(url.port);
  }
  if (url.protocol === "https:") {
    return 443;
  }
  return 80;
}

function parseNodeBin(raw: string | undefined): string {
  const nodeBin = raw ?? "node";
  if (
    nodeBin.length === 0 ||
    nodeBin.includes("\0") ||
    /[;&|`$<>]/.test(nodeBin)
  ) {
    throw new Error(
      `Invalid CLAN_NODE_BIN "${nodeBin}" (expected a plain executable path or "node")`,
    );
  }
  return nodeBin;
}

export function resolveTrueforgeCliPath(): string {
  return require.resolve("@truefoundry/trueforge/dist/cli.js");
}

export function assertNodeRuntime(nodeBin: string): void {
  const result = spawnSync(nodeBin, ["--version"], {
    encoding: "utf8",
    timeout: NODE_PREFLIGHT_TIMEOUT_MS,
  });

  if (result.error !== undefined) {
    throw new Error(
      `Could not run "${nodeBin} --version". TrueForge requires Node >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}.0.`,
      { cause: result.error },
    );
  }

  if (result.status !== 0) {
    throw new Error(
      `Could not run "${nodeBin} --version". TrueForge requires Node >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}.0.`,
    );
  }

  const version = result.stdout.trim();
  const match = /^v(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (match === null) {
    throw new Error(
      `Could not parse Node version from "${version}". TrueForge requires Node >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}.0.`,
    );
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  if (
    major < MIN_NODE_MAJOR ||
    (major === MIN_NODE_MAJOR && minor < MIN_NODE_MINOR)
  ) {
    throw new Error(
      `Node ${version} is too old. TrueForge requires Node >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}.0.`,
    );
  }
}

export function loadTrueforgeConfig(): TrueforgeConfig {
  const explicitBaseUrl = process.env.TRUEFORGE_BASE_URL;
  const envPort =
    process.env.TRUEFORGE_PORT !== undefined
      ? parsePort(process.env.TRUEFORGE_PORT)
      : undefined;

  let port: number;
  let baseUrl: string;

  if (explicitBaseUrl !== undefined) {
    assertLoopbackBaseUrl(explicitBaseUrl);
    baseUrl = explicitBaseUrl;
    port = portFromBaseUrl(explicitBaseUrl);
    if (envPort !== undefined && envPort !== port) {
      throw new Error(
        `TRUEFORGE_PORT (${String(envPort)}) does not match the port in TRUEFORGE_BASE_URL (${String(port)})`,
      );
    }
  } else {
    port = envPort ?? DEFAULT_PORT;
    baseUrl = `http://localhost:${String(port)}`;
    assertLoopbackBaseUrl(baseUrl);
  }

  return {
    port,
    baseUrl,
    startTimeoutMs: parseStartTimeoutMs(process.env.TRUEFORGE_START_TIMEOUT_MS),
    sdkTimeoutSeconds: DEFAULT_SDK_TIMEOUT_SECONDS,
    nodeBin: parseNodeBin(process.env.CLAN_NODE_BIN),
    cliPath: resolveTrueforgeCliPath(),
  };
}
