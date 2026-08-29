import { join } from "node:path";
import type { RepositoryContext } from "../repository/repository.ts";
import { runCommand, sanitizeEnv } from "../process/runner.ts";
import { TOOL_LIMITS } from "../tools/types.ts";
import { shouldSkipRelativePath } from "./ignore.ts";
import type { SearchMatch, SearchRequest, SearchResult } from "./types.ts";

function matchesPattern(
  line: string,
  pattern: string,
  fixedString: boolean,
  caseSensitive: boolean,
): boolean {
  if (fixedString) {
    return caseSensitive ? line.includes(pattern) : line.toLowerCase().includes(pattern.toLowerCase());
  }
  const flags = caseSensitive ? "" : "i";
  try {
    return new RegExp(pattern, flags).test(line);
  } catch {
    return false;
  }
}

export async function listGitCandidates(repo: RepositoryContext): Promise<string[]> {
  const result = await runCommand({
    command: "git",
    args: ["ls-files", "-co", "--exclude-standard"],
    cwd: repo.root,
    timeoutMs: 30_000,
    maxStdoutBytes: TOOL_LIMITS.maxOutputBytes * 4,
    maxStderrBytes: 8_192,
    env: sanitizeEnv(undefined),
    authorizedRoot: repo.root,
  });
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || "git ls-files failed");
  }
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !shouldSkipRelativePath(line));
}

function pathMatchesInclude(rel: string, include: string | undefined, basePath: string | undefined): boolean {
  if (basePath !== undefined && basePath.length > 0) {
    const normalized = basePath.replace(/^\.\/?/, "");
    if (normalized.length > 0 && !rel.startsWith(normalized)) {
      return false;
    }
  }
  if (include === undefined || include.length === 0) {
    return true;
  }
  const glob = new Bun.Glob(include);
  return glob.match(rel);
}

export async function searchWithGitFallback(
  repo: RepositoryContext,
  request: SearchRequest,
): Promise<SearchResult> {
  const maxMatches = request.maxMatches ?? TOOL_LIMITS.maxGrepMatches;
  const fixedString = request.fixedString ?? false;
  const caseSensitive = request.caseSensitive ?? false;
  const candidates = await listGitCandidates(repo);
  const matches: SearchMatch[] = [];
  let truncated = false;

  for (const rel of candidates) {
    if (!pathMatchesInclude(rel, request.include, request.path)) {
      continue;
    }
    const full = join(repo.root, rel);
    const file = Bun.file(full);
    if (!(await file.exists()) || file.size > TOOL_LIMITS.maxFileBytes) {
      continue;
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.includes(0)) {
      continue;
    }
    const lines = bytes.toString("utf8").split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line === undefined) {
        continue;
      }
      if (!matchesPattern(line, request.pattern, fixedString, caseSensitive)) {
        continue;
      }
      const match: SearchMatch = {
        path: rel,
        line: i + 1,
        text: line.slice(0, 400),
      };
      const ctxBefore = request.contextBefore ?? 0;
      const ctxAfter = request.contextAfter ?? 0;
      if (ctxBefore > 0) {
        match.before = lines.slice(Math.max(0, i - ctxBefore), i).map((l) => l.slice(0, 400));
      }
      if (ctxAfter > 0) {
        match.after = lines.slice(i + 1, i + 1 + ctxAfter).map((l) => l.slice(0, 400));
      }
      matches.push(match);
      if (matches.length >= maxMatches) {
        truncated = true;
        return { matches, truncated };
      }
    }
  }

  return { matches, truncated };
}
