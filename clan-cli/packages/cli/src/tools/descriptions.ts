const DESCRIPTIONS: Record<string, string> = {
  repo_info:
    "Return metadata about the authorized repository boundary (root path, identity, default branch).",
  list_directory:
    "List entries in a directory inside the authorized repository with file/directory/symlink types. Protected secret paths are denied.",
  read_file:
    "Read a text file inside the authorized repository. Protected secret paths and foreign paths are denied.",
  glob:
    "Find files matching a glob pattern inside the authorized repository. Honors ignore rules and excludes protected paths.",
  grep:
    "Search text files inside the authorized repository using regex or fixed-string matching. Honors repository ignore rules, excludes generated/protected paths, and returns bounded structured matches.",
  git_status:
    "Show git status for the authorized repository working tree (short format with branch).",
  git_diff:
    "Show a bounded diff summary for the authorized repository or task worktree.",
  create_file:
    "Create a new text file inside the authorized Build worktree. Fails if the file already exists.",
  write_file:
    "Replace entire file contents inside the authorized Build worktree. Optional expected content guards against stale writes.",
  apply_patch:
    "Replace one unique exact text occurrence in an existing file inside the Build worktree. Fails when the target text is missing or ambiguous unless replaceAll is requested.",
  replace_range:
    "Replace an inclusive 1-based line range in a file inside the Build worktree.",
  delete_file:
    "Delete a file inside the Build worktree. Requires explicit human approval.",
  run_command:
    "Run a structured command + argv inside the authorized Build worktree using ClanCode process policy. Dangerous or unknown commands require approval.",
};

export function toolDescription(name: string): string {
  return DESCRIPTIONS[name] ?? `ClanCode repository tool: ${name}`;
}
