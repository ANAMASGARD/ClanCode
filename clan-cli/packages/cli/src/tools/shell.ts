import type { RepositoryContext } from "../repository/repository.ts";
import { resolveWithinRepo } from "../repository/repository.ts";
import {
  evaluateCommand,
  runCommand,
  sanitizeEnv,
} from "../process/runner.ts";
import { fail, ok, TOOL_LIMITS, type ToolResult } from "./types.ts";

export async function runCommandTool(
  repo: RepositoryContext,
  input: {
    command: string;
    args: string[];
    cwd?: string;
    signal?: AbortSignal;
    approved: boolean;
  },
): Promise<ToolResult<{
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}>> {
  const command = input.command.trim();
  if (command.length === 0) {
    return fail("invalid_args", "command is required");
  }
  const policy = evaluateCommand(command, input.args);
  if (!policy.allow) {
    return fail("denied", policy.reason);
  }
  if (policy.risk !== "SHELL_SAFE" && !input.approved) {
    return fail(
      "approval_required",
      `${policy.risk} commands require human approval`,
    );
  }

  let cwd = repo.root;
  if (input.cwd !== undefined && input.cwd.length > 0) {
    cwd = await resolveWithinRepo(repo, input.cwd, { mustExist: true });
  }

  const result = await runCommand({
    command,
    args: input.args,
    cwd,
    signal: input.signal,
    timeoutMs: 120_000,
    maxStdoutBytes: TOOL_LIMITS.maxOutputBytes,
    maxStderrBytes: 16_384,
    env: sanitizeEnv(undefined),
    authorizedRoot: repo.root,
  });

  return ok(
    {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      timedOut: result.timedOut,
    },
    result.stdout.endsWith("…truncated") || result.stderr.endsWith("…truncated"),
  );
}
