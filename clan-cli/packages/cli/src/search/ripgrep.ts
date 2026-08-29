import type { RepositoryContext } from "../repository/repository.ts";
import { resolveWithinRepo } from "../repository/repository.ts";
import { runCommand, sanitizeEnv } from "../process/runner.ts";
import { TOOL_LIMITS } from "../tools/types.ts";
import { shouldSkipRelativePath } from "./ignore.ts";
import type { SearchMatch, SearchRequest, SearchResult } from "./types.ts";

let rgAvailable: boolean | undefined;

export async function isRipgrepAvailable(): Promise<boolean> {
  if (rgAvailable !== undefined) {
    return rgAvailable;
  }
  const probe = Bun.spawnSync(["rg", "--version"], { stdout: "pipe", stderr: "pipe" });
  rgAvailable = probe.exitCode === 0;
  return rgAvailable;
}

type RgJsonLine = {
  type?: string;
  data?: {
    path?: { text?: string };
    line_number?: number;
    lines?: { text?: string };
    submatches?: Array<{ start?: number; end?: number }>;
  };
};

function parseRgLine(
  line: string,
  contextBefore: number,
  contextAfter: number,
  lines: string[],
): SearchMatch | undefined {
  let parsed: RgJsonLine;
  try {
    parsed = JSON.parse(line) as RgJsonLine;
  } catch {
    return undefined;
  }
  if (parsed.type !== "match" || parsed.data === undefined) {
    return undefined;
  }
  const rel = parsed.data.path?.text;
  const lineNo = parsed.data.line_number;
  const text = parsed.data.lines?.text?.replace(/\n$/, "");
  if (rel === undefined || lineNo === undefined || text === undefined) {
    return undefined;
  }
  const column = parsed.data.submatches?.[0]?.start;
  const match: SearchMatch = {
    path: rel,
    line: lineNo,
    text: text.slice(0, 400),
  };
  if (column !== undefined) {
    match.column = column + 1;
  }
  if (contextBefore > 0 || contextAfter > 0) {
    const idx = lineNo - 1;
    if (contextBefore > 0) {
      match.before = lines.slice(Math.max(0, idx - contextBefore), idx).map((l) => l.slice(0, 400));
    }
    if (contextAfter > 0) {
      match.after = lines
        .slice(idx + 1, idx + 1 + contextAfter)
        .map((l) => l.slice(0, 400));
    }
  }
  return match;
}

export async function searchWithRipgrep(
  repo: RepositoryContext,
  request: SearchRequest,
): Promise<SearchResult> {
  const maxMatches = request.maxMatches ?? TOOL_LIMITS.maxGrepMatches;
  const searchRoot = await resolveWithinRepo(repo, request.path ?? ".", { mustExist: true });

  const args = ["--json", "--max-count", String(maxMatches)];
  if (!request.caseSensitive) {
    args.push("-i");
  }
  if (request.fixedString) {
    args.push("-F");
  }
  if (request.include !== undefined && request.include.length > 0) {
    args.push("-g", request.include);
  }
  if (request.contextBefore !== undefined && request.contextBefore > 0) {
    args.push("-B", String(request.contextBefore));
  }
  if (request.contextAfter !== undefined && request.contextAfter > 0) {
    args.push("-A", String(request.contextAfter));
  }
  args.push("--", request.pattern, searchRoot);

  const result = await runCommand({
    command: "rg",
    args,
    cwd: repo.root,
    timeoutMs: 30_000,
    maxStdoutBytes: TOOL_LIMITS.maxOutputBytes * 4,
    maxStderrBytes: 8_192,
    env: sanitizeEnv(undefined),
    authorizedRoot: repo.root,
  });

  if (result.exitCode !== 0 && result.exitCode !== 1) {
    throw new Error(result.stderr || "ripgrep failed");
  }

  const matches: SearchMatch[] = [];
  const fileCache = new Map<string, string[]>();
  let truncated = false;

  for (const line of result.stdout.split("\n")) {
    if (line.trim().length === 0) {
      continue;
    }
    const raw = JSON.parse(line) as RgJsonLine;
    const rel = raw.data?.path?.text;
    if (rel !== undefined && shouldSkipRelativePath(rel)) {
      continue;
    }
    let contextLines: string[] = [];
    if (rel !== undefined && (request.contextBefore ?? 0) + (request.contextAfter ?? 0) > 0) {
      if (!fileCache.has(rel)) {
        try {
          const resolved = await resolveWithinRepo(repo, rel, { mustExist: true });
          const file = Bun.file(resolved);
          if (await file.exists()) {
            fileCache.set(rel, (await file.text()).split("\n"));
          } else {
            fileCache.set(rel, []);
          }
        } catch {
          fileCache.set(rel, []);
        }
      }
      contextLines = fileCache.get(rel) ?? [];
    }
    const match = parseRgLine(
      line,
      request.contextBefore ?? 0,
      request.contextAfter ?? 0,
      contextLines,
    );
    if (match === undefined) {
      continue;
    }
    matches.push(match);
    if (matches.length >= maxMatches) {
      truncated = true;
      break;
    }
  }

  return { matches, truncated };
}
