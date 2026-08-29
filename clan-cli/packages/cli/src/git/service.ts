import type { RepositoryContext } from "../repository/repository.ts";
import { evaluateCommand, runCommand, sanitizeEnv } from "../process/runner.ts";
import { isSecretPath } from "../tools/types.ts";

export type PullRequestResult = {
  number: number;
  url: string;
  base: string;
  head: string;
};

export type GitService = {
  status(cwd: string): Promise<string>;
  diff(cwd: string): Promise<string>;
  commit(cwd: string, message: string): Promise<string>;
  push(cwd: string, branch: string, defaultBranch: string | undefined): Promise<string>;
  createPullRequest(input: {
    cwd: string;
    title: string;
    body: string;
    base: string;
    head: string;
  }): Promise<PullRequestResult>;
};

function porcelainPaths(output: string): string[] {
  const paths: string[] = [];
  for (const line of output.split("\n")) {
    if (line.length < 4) {
      continue;
    }
    const rest = line.slice(3);
    const path = rest.includes(" -> ") ? (rest.split(" -> ").at(-1) ?? rest) : rest;
    if (path.length > 0) {
      paths.push(path);
    }
  }
  return paths;
}

export function assertTaskBranch(
  branch: string,
  defaultBranch: string | undefined,
): void {
  if (defaultBranch !== undefined && branch === defaultBranch) {
    throw new Error("Refusing to push the default branch");
  }
  if (branch === "main" || branch === "master") {
    throw new Error("Refusing to push a protected default branch name");
  }
  if (!branch.startsWith("clancode/")) {
    throw new Error("Refusing to operate on a non-task branch");
  }
}

export function createGitService(): GitService {
  return {
    async status(cwd) {
      const result = await runCommand({
        command: "git",
        args: ["status", "--short", "--branch"],
        cwd,
        timeoutMs: 15_000,
        maxStdoutBytes: 64_000,
        maxStderrBytes: 8_192,
        env: sanitizeEnv(undefined),
        authorizedRoot: cwd,
      });
      if (result.exitCode !== 0) {
        throw new Error(result.stderr || "git status failed");
      }
      return result.stdout;
    },
    async diff(cwd) {
      const result = await runCommand({
        command: "git",
        args: ["diff", "HEAD"],
        cwd,
        timeoutMs: 15_000,
        maxStdoutBytes: 256_000,
        maxStderrBytes: 8_192,
        env: sanitizeEnv(undefined),
        authorizedRoot: cwd,
      });
      if (result.exitCode !== 0) {
        throw new Error(result.stderr || "git diff failed");
      }
      return result.stdout;
    },
    async commit(cwd, message) {
      const status = await runCommand({
        command: "git",
        args: ["status", "--porcelain", "--untracked-files=all"],
        cwd,
        timeoutMs: 10_000,
        maxStdoutBytes: 64_000,
        maxStderrBytes: 4_096,
        env: sanitizeEnv(undefined),
        authorizedRoot: cwd,
      });
      const toStage = porcelainPaths(status.stdout).filter((path) => !isSecretPath(path));
      if (toStage.length === 0) {
        throw new Error("Nothing to commit after excluding protected paths");
      }
      await runCommand({
        command: "git",
        args: ["add", "--", ...toStage],
        cwd,
        timeoutMs: 15_000,
        maxStdoutBytes: 16_000,
        maxStderrBytes: 8_192,
        env: sanitizeEnv(undefined),
        authorizedRoot: cwd,
      });
      const result = await runCommand({
        command: "git",
        args: ["commit", "-m", message],
        cwd,
        timeoutMs: 15_000,
        maxStdoutBytes: 16_000,
        maxStderrBytes: 8_192,
        env: sanitizeEnv(undefined),
        authorizedRoot: cwd,
      });
      if (result.exitCode !== 0) {
        throw new Error(result.stderr || "git commit failed");
      }
      return result.stdout;
    },
    async push(cwd, branch, defaultBranch) {
      assertTaskBranch(branch, defaultBranch);
      const policy = evaluateCommand("git", ["push", "-u", "origin", branch]);
      if (!policy.allow) {
        throw new Error(policy.reason);
      }
      const result = await runCommand({
        command: "git",
        args: ["push", "-u", "origin", branch],
        cwd,
        timeoutMs: 60_000,
        maxStdoutBytes: 16_000,
        maxStderrBytes: 16_000,
        env: sanitizeEnv(undefined),
        authorizedRoot: cwd,
      });
      if (result.exitCode !== 0) {
        throw new Error(result.stderr || "git push failed");
      }
      return result.stdout;
    },
    async createPullRequest(input) {
      assertTaskBranch(input.head, input.base);
      const result = await runCommand({
        command: "gh",
        args: [
          "pr",
          "create",
          "--title",
          input.title,
          "--body",
          input.body,
          "--base",
          input.base,
          "--head",
          input.head,
        ],
        cwd: input.cwd,
        timeoutMs: 60_000,
        maxStdoutBytes: 16_000,
        maxStderrBytes: 16_000,
        env: sanitizeEnv(undefined),
        authorizedRoot: input.cwd,
      });
      if (result.exitCode !== 0) {
        throw new Error(result.stderr || "gh pr create failed");
      }
      const url = result.stdout.trim().split("\n").at(-1) ?? "";
      const numberMatch = /\/pull\/(\d+)/.exec(url);
      return {
        number: numberMatch ? Number(numberMatch[1]) : 0,
        url,
        base: input.base,
        head: input.head,
      };
    },
  };
}

export async function snapshotWorkingTree(
  repo: RepositoryContext,
): Promise<string> {
  const result = await runCommand({
    command: "git",
    args: ["status", "--porcelain"],
    cwd: repo.root,
    timeoutMs: 10_000,
    maxStdoutBytes: 64_000,
    maxStderrBytes: 4_096,
    env: sanitizeEnv(undefined),
    authorizedRoot: repo.root,
  });
  return result.stdout;
}
