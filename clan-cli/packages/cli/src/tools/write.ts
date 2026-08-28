import { mkdir, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import {
  type RepositoryContext,
  resolveWithinRepo,
  RepositoryBoundaryError,
} from "../repository/repository.ts";
import { fail, isSecretPath, ok, TOOL_LIMITS, type ToolResult } from "./types.ts";
import { runCommand, sanitizeEnv } from "../process/runner.ts";

function relativeToRoot(root: string, absolute: string): string {
  return absolute === root ? "." : absolute.slice(root.length + 1);
}

export async function createFile(
  repo: RepositoryContext,
  userPath: string,
  content: string,
): Promise<ToolResult<{ path: string }>> {
  try {
    const resolved = await resolveWithinRepo(repo, userPath);
    const rel = relativeToRoot(repo.root, resolved);
    if (isSecretPath(rel)) {
      return fail("secret_path", "Refusing to write a protected path");
    }
    if (await Bun.file(resolved).exists()) {
      return fail("exists", "File already exists");
    }
    if (Buffer.byteLength(content) > TOOL_LIMITS.maxFileBytes) {
      return fail("too_large", "Content exceeds size limit");
    }
    await mkdir(dirname(resolved), { recursive: true });
    await Bun.write(resolved, content);
    return ok({ path: rel });
  } catch (error) {
    return mapBoundary(error);
  }
}

export async function writeFileTool(
  repo: RepositoryContext,
  userPath: string,
  content: string,
  expected?: string,
): Promise<ToolResult<{ path: string }>> {
  try {
    const resolved = await resolveWithinRepo(repo, userPath);
    const rel = relativeToRoot(repo.root, resolved);
    if (isSecretPath(rel)) {
      return fail("secret_path", "Refusing to write a protected path");
    }
    if (content.includes("\0") || Buffer.from(content).includes(0)) {
      return fail("binary", "Binary editing is not supported");
    }
    if (Buffer.byteLength(content) > TOOL_LIMITS.maxFileBytes) {
      return fail("too_large", "Content exceeds size limit");
    }
    if (expected !== undefined && (await Bun.file(resolved).exists())) {
      const current = await Bun.file(resolved).text();
      if (current !== expected) {
        return fail("stale", "File content does not match expected content");
      }
    }
    await mkdir(dirname(resolved), { recursive: true });
    await Bun.write(resolved, content);
    return ok({ path: rel });
  } catch (error) {
    return mapBoundary(error);
  }
}

export async function replaceRange(
  repo: RepositoryContext,
  userPath: string,
  startLine: number,
  endLine: number,
  replacement: string,
): Promise<ToolResult<{ path: string }>> {
  try {
    const resolved = await resolveWithinRepo(repo, userPath, { mustExist: true });
    const rel = relativeToRoot(repo.root, resolved);
    const current = await Bun.file(resolved).text();
    if (current.includes("\0")) {
      return fail("binary", "Binary editing is not supported");
    }
    const lines = current.split("\n");
    if (startLine < 1 || endLine < startLine || endLine > lines.length) {
      return fail("range", "Invalid line range");
    }
    const next = [
      ...lines.slice(0, startLine - 1),
      ...replacement.split("\n"),
      ...lines.slice(endLine),
    ].join("\n");
    await Bun.write(resolved, next);
    return ok({ path: rel });
  } catch (error) {
    return mapBoundary(error);
  }
}

export async function applyPatch(
  repo: RepositoryContext,
  userPath: string,
  search: string,
  replace: string,
): Promise<ToolResult<{ path: string }>> {
  try {
    const resolved = await resolveWithinRepo(repo, userPath, { mustExist: true });
    const rel = relativeToRoot(repo.root, resolved);
    const current = await Bun.file(resolved).text();
    if (!current.includes(search)) {
      return fail("stale", "Patch search text was not found (stale content)");
    }
    const next = current.replace(search, replace);
    await Bun.write(resolved, next);
    return ok({ path: rel });
  } catch (error) {
    return mapBoundary(error);
  }
}

export type DeleteGate = { approved: boolean };

export async function deleteFile(
  repo: RepositoryContext,
  userPath: string,
  gate: DeleteGate,
): Promise<ToolResult<{ path: string }>> {
  if (!gate.approved) {
    return fail("approval_required", "delete_file requires human approval");
  }
  try {
    const resolved = await resolveWithinRepo(repo, userPath, { mustExist: true });
    const rel = relativeToRoot(repo.root, resolved);
    await unlink(resolved);
    return ok({ path: rel });
  } catch (error) {
    return mapBoundary(error);
  }
}

export async function diffMetadata(
  repo: RepositoryContext,
): Promise<{ stat: string; diff: string }> {
  const stat = await runCommand({
    command: "git",
    args: ["diff", "--stat"],
    cwd: repo.root,
    timeoutMs: 10_000,
    maxStdoutBytes: TOOL_LIMITS.maxOutputBytes,
    maxStderrBytes: 4_096,
    env: sanitizeEnv(undefined),
    authorizedRoot: repo.root,
  });
  const diff = await runCommand({
    command: "git",
    args: ["diff"],
    cwd: repo.root,
    timeoutMs: 15_000,
    maxStdoutBytes: TOOL_LIMITS.maxOutputBytes,
    maxStderrBytes: 4_096,
    env: sanitizeEnv(undefined),
    authorizedRoot: repo.root,
  });
  return { stat: stat.stdout, diff: diff.stdout };
}

function mapBoundary(error: unknown): ToolResult<never> {
  if (error instanceof RepositoryBoundaryError) {
    return fail(error.code, error.message);
  }
  return fail("internal", error instanceof Error ? error.message : String(error));
}
