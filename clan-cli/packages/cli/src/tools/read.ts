import { join } from "node:path";
import { lstat, readdir, stat } from "node:fs/promises";
import {
  type RepositoryContext,
  resolveWithinRepo,
  RepositoryBoundaryError,
} from "../repository/repository.ts";
import { fail, isSecretPath, ok, TOOL_LIMITS, type ToolResult } from "./types.ts";
import { runCommand, sanitizeEnv } from "../process/runner.ts";
import { diffMetadata } from "./write.ts";
import { searchRepository } from "../search/index.ts";
import { shouldSkipRelativePath } from "../search/ignore.ts";

function relativeToRoot(root: string, absolute: string): string {
  return absolute === root ? "." : absolute.slice(root.length + 1);
}

export type DirectoryEntry = {
  name: string;
  type: "file" | "directory" | "symlink";
};

export async function repoInfo(repo: RepositoryContext): Promise<ToolResult<RepositoryContext>> {
  return ok(repo);
}

export async function listDirectory(
  repo: RepositoryContext,
  userPath: string,
): Promise<ToolResult<{ entries: DirectoryEntry[]; truncated: boolean }>> {
  try {
    const resolved = await resolveWithinRepo(repo, userPath, { mustExist: true });
    const rel = relativeToRoot(repo.root, resolved);
    if (isSecretPath(rel)) {
      return fail("secret_path", "Refusing to list a protected path");
    }
    const names = await readdir(resolved);
    const entries: DirectoryEntry[] = [];
    for (const name of names) {
      if (isSecretPath(name)) {
        continue;
      }
      const child = join(resolved, name);
      const info = await lstat(child);
      let type: DirectoryEntry["type"] = "file";
      if (info.isDirectory()) {
        type = "directory";
      } else if (info.isSymbolicLink()) {
        type = "symlink";
      }
      entries.push({ name, type });
      if (entries.length >= TOOL_LIMITS.maxDirectoryEntries) {
        break;
      }
    }
    const truncated = names.length > TOOL_LIMITS.maxDirectoryEntries;
    return ok({ entries, truncated }, truncated);
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
  basePath?: string,
): Promise<ToolResult<{ matches: string[] }>> {
  const scanRoot = basePath
    ? await resolveWithinRepo(repo, basePath, { mustExist: true })
    : repo.root;
  const glob = new Bun.Glob(pattern);
  const matches: string[] = [];
  let truncated = false;
  const relPrefix =
    scanRoot === repo.root ? "" : `${relativeToRoot(repo.root, scanRoot)}/`;
  for await (const match of glob.scan({ cwd: scanRoot, onlyFiles: true })) {
    const rel = relPrefix.length > 0 ? `${relPrefix}${match}` : match;
    if (shouldSkipRelativePath(rel)) {
      continue;
    }
    try {
      await resolveWithinRepo(repo, rel, { mustExist: true });
    } catch {
      continue;
    }
    matches.push(rel);
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
  options?: {
    path?: string;
    include?: string;
    glob?: string;
    caseSensitive?: boolean;
    fixedString?: boolean;
    maxMatches?: number;
  },
): Promise<ToolResult<{ matches: Array<{ path: string; line: number; text: string; column?: number }> }>> {
  try {
    const result = await searchRepository(repo, {
      pattern,
      path: options?.path,
      include: options?.include ?? options?.glob,
      caseSensitive: options?.caseSensitive,
      fixedString: options?.fixedString,
      maxMatches: options?.maxMatches,
    });
    return ok({ matches: result.matches }, result.truncated);
  } catch (error) {
    return fail("search_failed", error instanceof Error ? error.message : String(error));
  }
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
