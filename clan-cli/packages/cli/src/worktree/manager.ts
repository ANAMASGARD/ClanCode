import { createHash, randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { RepositoryContext } from "../repository/repository.ts";
import { runCommand, sanitizeEnv } from "../process/runner.ts";

export type TaskWorktree = {
  worktreePath: string;
  branchName: string;
  baseCommit: string;
};

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug.length > 0 ? slug : "task";
}

function worktreeRoot(repo: RepositoryContext): string {
  const stateHome = process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state");
  const repoId = createHash("sha256").update(repo.identity).digest("hex").slice(0, 16);
  return join(stateHome, "clancode", "worktrees", repoId);
}

async function git(
  repo: RepositoryContext,
  args: string[],
  cwd: string = repo.root,
): Promise<string> {
  const result = await runCommand({
    command: "git",
    args,
    cwd,
    timeoutMs: 30_000,
    maxStdoutBytes: 64_000,
    maxStderrBytes: 16_000,
    env: sanitizeEnv(undefined),
    authorizedRoot: cwd === repo.root ? repo.root : undefined,
  });
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  }
  return result.stdout.trim();
}

export async function createTaskWorktree(
  repo: RepositoryContext,
  taskTitle: string,
  baseCommit?: string,
): Promise<TaskWorktree> {
  const commit = baseCommit ?? (await git(repo, ["rev-parse", "HEAD"]));
  const shortId = randomBytes(3).toString("hex");
  const branchName = `clancode/${slugify(taskTitle)}-${shortId}`;
  await git(repo, ["branch", branchName, commit]);
  const worktreePath = join(worktreeRoot(repo), branchName.replaceAll("/", "-"));
  await mkdir(worktreeRoot(repo), { recursive: true });
  try {
    await git(repo, ["worktree", "add", worktreePath, branchName]);
  } catch (error) {
    await git(repo, ["branch", "-D", branchName]).catch(() => undefined);
    throw error;
  }
  return { worktreePath, branchName, baseCommit: commit };
}

export async function removeTaskWorktree(
  repo: RepositoryContext,
  worktree: TaskWorktree,
): Promise<void> {
  await git(repo, ["worktree", "remove", "--force", worktree.worktreePath]).catch(
    () => undefined,
  );
}
