import { readdir, stat } from "node:fs/promises";
import {
  type RepositoryContext,
  resolveWithinRepo,
  RepositoryBoundaryError,
} from "../repository/repository.ts";
import { fail, isSecretPath, ok, TOOL_LIMITS, type ToolResult } from "./types.ts";
import { runCommand, sanitizeEnv } from "../process/runner.ts";
import { diffMetadata } from "./write.ts";

function relativeToRoot(root: string, absolute: string): string {
  return absolute === root ? "." : absolute.slice(root.length + 1);
}

export async function repoInfo(repo: RepositoryContext): Promise<ToolResult<RepositoryContext>> {
  return ok(repo);
}

export async function listDirectory(
  repo: RepositoryContext,
  userPath: string,
): Promise<ToolResult<{ entries: string[]; truncated: boolean }>> {
  try {
    const resolved = await resolveWithinRepo(repo, userPath, { mustExist: true });
    const rel = relativeToRoot(repo.root, resolved);
    if (isSecretPath(rel)) {
      return fail("secret_path", "Refusing to list a protected path");
    }
    const names = await readdir(resolved);
    const truncated = names.length > TOOL_LIMITS.maxDirectoryEntries;
    return ok({
      entries: names.slice(0, TOOL_LIMITS.maxDirectoryEntries),
      truncated,
    }, truncated);
  } catch (error) {
    return mapBoundary(error);
  }
}

export async function readFileTool(
  repo: RepositoryContext,
  userPath: string,
): Promise<ToolResult<{ path: string; content: string }>> {
  try {
    const resolved = await resolveWithinRepo(repo, userPath, { mustExist: true });
    const rel = relativeToRoot(repo.root, resolved);
    if (isSecretPath(rel)) {
      return fail("secret_path", "Refusing to read a protected path");
    }
    const file = Bun.file(resolved);
    if (file.size > TOOL_LIMITS.maxFileBytes) {
      return fail("too_large", `File exceeds ${String(TOOL_LIMITS.maxFileBytes)} bytes`);
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.includes(0)) {
      return fail("binary", "Binary files cannot be read");
    }
    let content = bytes.toString("utf8");
    let truncated = false;
    if (Buffer.byteLength(content) > TOOL_LIMITS.maxOutputBytes) {
      content = Buffer.from(content).subarray(0, TOOL_LIMITS.maxOutputBytes).toString();
      truncated = true;
    }
    return ok({ path: rel, content }, truncated);
  } catch (error) {
    return mapBoundary(error);
  }
}

export async function globTool(
  repo: RepositoryContext,
  pattern: string,
): Promise<ToolResult<{ matches: string[] }>> {
  const glob = new Bun.Glob(pattern);
  const matches: string[] = [];
  let truncated = false;
  for await (const match of glob.scan({ cwd: repo.root, onlyFiles: true })) {
    if (isSecretPath(match)) {
      continue;
    }
    try {
      await resolveWithinRepo(repo, match, { mustExist: true });
    } catch {
      continue;
    }
    matches.push(match);
    if (matches.length >= TOOL_LIMITS.maxDirectoryEntries) {
      truncated = true;
      break;
    }
  }
  return ok({ matches }, truncated);
}

export async function grepTool(
  repo: RepositoryContext,
  pattern: string,
  globPattern?: string,
): Promise<ToolResult<{ matches: Array<{ path: string; line: number; text: string }> }>> {
  const glob = new Bun.Glob(globPattern ?? "**/*.{ts,tsx,js,jsx,json,md}");
  const matches: Array<{ path: string; line: number; text: string }> = [];
  let regex: RegExp;
  try {
    regex = new RegExp(pattern);
  } catch {
    return fail("bad_pattern", "Invalid grep pattern");
  }
  let truncated = false;
  for await (const match of glob.scan({ cwd: repo.root, onlyFiles: true })) {
    if (isSecretPath(match)) {
      continue;
    }
    let resolved: string;
    try {
      resolved = await resolveWithinRepo(repo, match, { mustExist: true });
    } catch {
      continue;
    }
    const file = Bun.file(resolved);
    if (file.size > TOOL_LIMITS.maxFileBytes) {
      continue;
    }
    const text = await file.text();
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line !== undefined && regex.test(line)) {
        matches.push({ path: match, line: i + 1, text: line.slice(0, 400) });
        if (matches.length >= TOOL_LIMITS.maxGrepMatches) {
          truncated = true;
          return ok({ matches }, true);
        }
      }
    }
  }
  return ok({ matches }, truncated);
}

export async function gitStatusTool(
  repo: RepositoryContext,
): Promise<ToolResult<{ status: string }>> {
  const result = await runCommand({
    command: "git",
    args: ["status", "--short", "--branch"],
    cwd: repo.root,
    timeoutMs: 10_000,
    maxStdoutBytes: TOOL_LIMITS.maxOutputBytes,
    maxStderrBytes: 8_192,
    env: sanitizeEnv(undefined),
    authorizedRoot: repo.root,
  });
  if (result.exitCode !== 0) {
    return fail("git_failed", result.stderr || "git status failed");
  }
  return ok({ status: result.stdout });
}

export async function gitDiffTool(
  repo: RepositoryContext,
): Promise<ToolResult<{ diff: string }>> {
  const meta = await diffMetadata(repo);
  return ok({ diff: meta.diff }, meta.diff.endsWith("…truncated"));
}

export async function pathStat(
  repo: RepositoryContext,
  userPath: string,
): Promise<ToolResult<{ isFile: boolean; size: number }>> {
  try {
    const resolved = await resolveWithinRepo(repo, userPath, { mustExist: true });
    const info = await stat(resolved);
    return ok({ isFile: info.isFile(), size: info.size });
  } catch (error) {
    return mapBoundary(error);
  }
}

function mapBoundary(error: unknown): ToolResult<never> {
  if (error instanceof RepositoryBoundaryError) {
    return fail(error.code, error.message);
  }
  return fail("internal", error instanceof Error ? error.message : String(error));
}
