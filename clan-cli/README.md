# ClanCode CLI

Local execution-plane CLI. ClanCode **wraps TrueForge** — it does not replace
or fork it. Users run `clancode`.

```bash
clancode                 # interactive OpenTUI harness
clancode login           # pair or re-pair with the web control plane (switch Clerk account)
clancode run "task"      # headless (same run supervisor)
clancode doctor [--json]
clancode --version
clancode --help
```

From the `clan-cli/` workspace during development:

```bash
bun run login            # same as clancode login
bun run cli login        # explicit CLI entrypoint
bun run dev:clan         # interactive harness
```

## Requirements

- **Bun** — CLI development and the `clancode` binary
- **Node.js >= 22.14.0** — TrueForge local server (spawned or attached)
- A TrueForge model provider (or `CLAN_TRUEFORGE_MODEL`) for live agent turns

## Development

```bash
bun install --ignore-scripts
bun run --cwd packages/cli start
bun run --cwd packages/cli typecheck
bun test packages/cli/src packages/protocol/src
bun run --cwd packages/cli supervisor:smoke
bun run --cwd packages/cli pack:local
```

`bun install --ignore-scripts` is required because TrueForge depends on
`better-sqlite3` native builds.

## Architecture

TrueForge owns the agent loop (sessions, turns, streaming, MCP, approvals).
ClanCode owns supervision, repository authorization, worktrees, local tools,
process execution, Git delivery, RunEvents, and the TUI.

Plan mode is read-only. Build mode edits an isolated `clancode/*` worktree and
never mutates the user's active checkout (no stash/reset/clean).
