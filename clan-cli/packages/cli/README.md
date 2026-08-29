# ClanCode CLI

Local-first TrueForge-supervised AI coding harness for your laptop.

ClanCode **wraps TrueForge** — it does not replace the agent runtime. The CLI owns repository authorization, worktrees, local tools, approvals, validation, Git/PR delivery, and the terminal UI.

## Install

Requires **Bun** for the CLI binary and **Node >= 22.14** for TrueForge.

```bash
npm install -g @clancode/cli
# or
bun add -g @clancode/cli
```

Then run:

```bash
clancode
clancode --help
clancode doctor
```

## Commands

| Command | Description |
|---------|-------------|
| `clancode` | Interactive OpenTUI chat (default) |
| `clancode run <repo>` | Non-interactive run in a repository |
| `clancode doctor [--json]` | Environment and TrueForge readiness checks |
| `clancode connect` | Long-lived Socket.IO client for the future web control plane |

### Chat slash commands

- `/new` — start a fresh TrueForge session
- `/models` — list configured TrueForge models
- `/model <name>` — persist preferred model
- `/sessions` — list resumable local sessions
- `/resume [id]` — resume newest or a specific session

## Configuration

| Variable | Purpose |
|----------|---------|
| `CLAN_TRUEFORGE_URL` | Attach to an existing TrueForge server |
| `CLAN_TRUEFORGE_MODEL` | Override model selection |
| `CLANCODE_DEVICE_TOKEN` | Device credential for `clancode connect` |
| `CLANCODE_CONTROL_URL` | Control-plane Socket.IO URL for `clancode connect` |
| `XDG_STATE_HOME` | Override state directory (sessions, preferences, command journal) |

State is stored under `$XDG_STATE_HOME/clancode/` (default `~/.local/state/clancode/`).

## Architecture

```
Future website ← Socket.IO → clancode connect → RunSupervisor → TrueForge → repo/worktree
```

The website never talks to TrueForge directly. Sensitive laptop paths, tokens, and raw tool output stay local; outbound events use an allowlisted projection.

## Development

From the repository `clan-cli/` workspace:

```bash
bun install --ignore-scripts
bun run --cwd packages/cli dev
bun run --cwd packages/cli test
bun run --cwd packages/cli typecheck
bun run --cwd packages/cli pack:local
```

## License

No license is bundled yet. Choose and add a license before npm publication.
