# ClanCode CLI

[![npm version](https://img.shields.io/npm/v/@clancode/cli?label=npm&color=CB3837)](https://www.npmjs.com/package/@clancode/cli)

Local-first **TrueForge**-supervised AI coding harness for your laptop.

ClanCode **wraps TrueForge** — it does not replace the agent runtime. The CLI owns repository authorization, isolated worktrees, local tools, human approvals, validation, Git/PR delivery, and the OpenTUI terminal UI.

> **Beta:** install with the `@next` dist-tag until a stable release is promoted.

## Requirements

| Requirement | Why |
|-------------|-----|
| **[Bun](https://bun.sh) >= 1.4** | The `clancode` binary runs on Bun (`#!/usr/bin/env bun`). **`npm install -g` does not install Bun.** |
| **Node.js >= 22.14** | TrueForge runtime |
| **Git** | Repository resolution, worktrees, PR workflow |
| **TrueForge model** | Configure in TrueForge UI (`http://localhost:8790`) or set `CLAN_TRUEFORGE_MODEL` |

## Install

```bash
npm install -g @clancode/cli@next
```

Or with Bun:

```bash
bun add -g @clancode/cli@next
```

Then:

```bash
clancode --help
clancode doctor
clancode
```

Pair once with the [ClanCode web control plane](https://github.com/ANAMASGARD/ClanCode):

```bash
clancode login
```

## Commands

| Command | Description |
|---------|-------------|
| `clancode` | Interactive OpenTUI harness (auto-connects when paired) |
| `clancode --offline --repo PATH` | Local harness without web pairing |
| `clancode run "task" [--repo PATH] [--mode build]` | Headless run |
| `clancode login` / `clancode pair` | Pair this laptop with the web control plane |
| `clancode connect` | Long-lived Socket.IO client |
| `clancode new [--repo PATH]` | Fresh TrueForge session |
| `clancode models` / `clancode model <name>` | List / select TrueForge model |
| `clancode doctor [--json]` | Environment diagnostics (never prints secrets) |

Run from the **Git repository you want the agent to work on**, or pass `--repo /absolute/path`.

### TUI slash commands

`/plan`, `/build`, `/new`, `/cancel`, `/status`, `/diff`, `/validate`, `/sessions`, `/resume`, `/models`, `/model`, `/approve`, `/deny`, `/commit`, `/push`, `/pr`, `/doctor`, `/exit`

## Configuration

| Variable | Purpose |
|----------|---------|
| `CLAN_TRUEFORGE_MODEL` | Override TrueForge model selection |
| `TRUEFORGE_BASE_URL` / `TRUEFORGE_PORT` | Attach to existing TrueForge (loopback only) |
| `CLAN_NODE_BIN` | Node binary for TrueForge spawn (default `node`) |
| `CLANCODE_DEVICE_TOKEN` + `CLANCODE_CONTROL_URL` + `CLANCODE_DEVICE_ID` | Full env override for control-plane connect |
| `XDG_STATE_HOME` | Override state dir (sessions, credentials, command journal) |

State defaults to `$XDG_STATE_HOME/clancode/` (`~/.local/state/clancode/`).

## Architecture

```text
ClanCode web (control plane) ←Socket.IO→ clancode CLI → RunSupervisor → TrueForge → worktree
```

The website never executes repository tools. Outbound events are allowlisted; secrets and raw paths stay local.

Full setup (web + gateway + three terminals): [ClanCode README](https://github.com/ANAMASGARD/ClanCode#-run-clancode-locally).

## Development

From the monorepo `clan-cli/` workspace:

```bash
bun install
bun run --cwd packages/cli typecheck
bun run --cwd packages/cli test
bun run --cwd packages/cli pack:local
```

## License

**AGPL-3.0-or-later** — see [LICENSE](./LICENSE). Modifiers who run modified versions as a network service must offer corresponding source to users, per the Affero GPL.
