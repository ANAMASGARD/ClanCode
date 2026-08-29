import { spawnSync, type SpawnSyncOptionsWithStringEncoding } from "node:child_process";

export class SpawnSyncOutputLimitError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "SpawnSyncOutputLimitError";
  }
}

export type BoundedSpawnSyncResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

function isOutputLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const errno = error as NodeJS.ErrnoException;
  return (
    errno.code === "ENOBUFS" ||
    error.message.includes("maxBuffer") ||
    error.message.includes("stdout maxBuffer length exceeded") ||
    error.message.includes("stderr maxBuffer length exceeded")
  );
}

export function spawnSyncBounded(
  command: string,
  args: readonly string[],
  options: {
    cwd?: string;
    timeoutMs?: number;
    maxOutputBytes?: number;
    env?: NodeJS.ProcessEnv;
  } = {},
): BoundedSpawnSyncResult {
  const maxBuffer = options.maxOutputBytes ?? 1_048_576;
  const spawnOptions: SpawnSyncOptionsWithStringEncoding = {
    encoding: "utf8",
    cwd: options.cwd,
    timeout: options.timeoutMs,
    maxBuffer,
    env: options.env,
  };

  let result;
  try {
    result = spawnSync(command, [...args], spawnOptions);
  } catch (error) {
    if (isOutputLimitError(error)) {
      throw new SpawnSyncOutputLimitError(
        `Subprocess output exceeded ${maxBuffer} bytes: ${command}`,
        { cause: error },
      );
    }
    throw error;
  }

  if (result.error !== undefined && isOutputLimitError(result.error)) {
    throw new SpawnSyncOutputLimitError(
      `Subprocess output exceeded ${maxBuffer} bytes: ${command}`,
      { cause: result.error },
    );
  }

  return {
    exitCode: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    timedOut: result.error !== undefined && result.signal === "SIGTERM",
  };
}
