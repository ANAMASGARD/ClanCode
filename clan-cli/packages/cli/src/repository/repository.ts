import { existsSync } from "node:fs";
import { realpath } from "node:fs/promises";
import { isAbsolute, join, relative } from "node:path";

export type RepositoryContext = {
  root: string;
  gitDir: string;
  identity: string;
  currentBranch?: string;
  defaultBranch?: string;
  dirty: boolean;
};

export class RepositoryBoundaryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RepositoryBoundaryError";
    this.code = code;
  }
}

function runGit(args: string[], cwd: string): { status: number; stdout: string; stderr: string } {
  const result = Bun.spawnSync(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    status: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

export async function resolveRepository(
  inputPath: string = process.cwd(),
): Promise<RepositoryContext> {
  if (!existsSync(inputPath)) {
    throw new RepositoryBoundaryError(
      "not_found",
      `Path does not exist: ${inputPath}`,
    );
  }
  const candidate = await realpath(inputPath);

  const gitRoot = runGit(["rev-parse", "--show-toplevel"], candidate);
  if (gitRoot.status !== 0) {
    throw new RepositoryBoundaryError(
      "not_git",
      `Not a Git repository: ${candidate}`,
    );
  }

  const root = await realpath(gitRoot.stdout.trim());
  const gitDirResult = runGit(["rev-parse", "--git-dir"], root);
  const gitDirRaw = gitDirResult.stdout.trim();
  const gitDir = await realpath(
    gitDirRaw.startsWith("/") ? gitDirRaw : join(root, gitDirRaw),
  );

  const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"], root).stdout.trim();
  const originHead = runGit(
    ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"],
    root,
  );
  const defaultBranch =
    originHead.status === 0
      ? originHead.stdout.trim().replace(/^origin\//, "")
      : branch === "HEAD"
        ? undefined
        : branch;

  const porcelain = runGit(["status", "--porcelain"], root).stdout;
  const remote = runGit(["config", "--get", "remote.origin.url"], root);
  const origin =
    remote.status === 0 && remote.stdout.trim().length > 0
      ? remote.stdout.trim()
      : "local";

  return {
    root,
    gitDir,
    identity: `${origin}::${root}`,
    currentBranch: branch === "HEAD" ? undefined : branch,
    defaultBranch,
    dirty: porcelain.trim().length > 0,
  };
}

export async function resolveWithinRepo(
  repo: RepositoryContext,
  userPath: string,
  options: { mustExist?: boolean } = {},
): Promise<string> {
  const root = await realpath(repo.root);
  const joined = userPath.startsWith("/")
    ? userPath
    : join(root, userPath);

  if (!existsSync(joined)) {
    if (options.mustExist === true) {
      throw new RepositoryBoundaryError(
        "not_found",
        `Path does not exist inside repository: ${userPath}`,
      );
    }
    const parent = join(joined, "..");
    let cursor = parent;
    const missing: string[] = [];
    const leaf = joined.split("/").filter(Boolean).at(-1);
    if (leaf === undefined || leaf === ".." || leaf === ".") {
      throw new RepositoryBoundaryError("escape", `Invalid path: ${userPath}`);
    }
    missing.unshift(leaf);
    while (!existsSync(cursor)) {
      const name = cursor.split("/").filter(Boolean).at(-1);
      if (name === undefined || name === ".." || name === ".") {
        throw new RepositoryBoundaryError("escape", `Invalid path: ${userPath}`);
      }
      missing.unshift(name);
      const next = join(cursor, "..");
      if (next === cursor) {
        throw new RepositoryBoundaryError("escape", `Path escapes repository: ${userPath}`);
      }
      cursor = next;
    }
    const existing = await realpath(cursor);
    if (relativeInside(root, existing) === null) {
      throw new RepositoryBoundaryError(
        "escape",
        `Path escapes repository: ${userPath}`,
      );
    }
    return join(existing, ...missing);
  }

  const resolved = await realpath(joined);
  if (relativeInside(root, resolved) === null) {
    throw new RepositoryBoundaryError(
      "escape",
      `Path escapes repository: ${userPath}`,
    );
  }
  return resolved;
}

function relativeInside(root: string, target: string): string | null {
  const rel = relative(root, target);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    return null;
  }
  return rel;
}
