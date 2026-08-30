# ClanCode

> Turn AI coding into a living clan.

[![npm version](https://img.shields.io/npm/v/@clancode/cli?label=npm&color=CB3837)](https://www.npmjs.com/package/@clancode/cli)
[![Demo](https://img.shields.io/badge/demo-YouTube-red)](https://youtu.be/istUU5onLCI)

Local-first AI coding harness: a **Next.js control plane** pairs with the **`clancode` CLI** on your machine. **[TrueForge](https://trueforge.dev)** runs agents locally; the clan **village visualizes real `RunEvent`s** — it never grants permissions or invents Git results.

**Demo:** [youtu.be/istUU5onLCI](https://youtu.be/istUU5onLCI) — task from Clan Castle → TrueForge on laptop → approval gate → validation → PR delivery.

| Docs | Purpose |
|------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Trust boundaries (stable) |
| [AGENTS.md](AGENTS.md) | Rules for AI assistants **developing** ClanCode |
| [memory/memory.md](memory/memory.md) | Current implementation status |
| [docs/quickstart.md](docs/quickstart.md) | Clone → running in ~15 min |

---

## Install CLI (beta)

> Requires **[Bun](https://bun.sh) ≥ 1.4**, **Node ≥ 22.14**, **Git**, and a **TrueForge** model. `npm install -g` does **not** install Bun.

**npm:** [@clancode/cli](https://www.npmjs.com/package/@clancode/cli) (`@next` = beta)

```bash
npm install -g @clancode/cli@next
# or: bun add -g @clancode/cli@next

clancode doctor
clancode login    # pair once with the web app
clancode          # run from your target Git repo (or use --repo PATH)
```

Web + gateway setup below. Source install: [docs/local-cli-from-source.md](docs/local-cli-from-source.md).

---

## Quick start (full stack)

```bash
git clone https://github.com/ANAMASGARD/ClanCode.git && cd ClanCode
bun install && cd clan-cli && bun install && cd ..
cp .env.example .env.local   # Clerk, Neon, PAIRING_DELIVERY_KEY, CLANCODE_REALTIME_RELAY_SECRET
bun run db:migrate
```

**Three terminals:**

| # | Command | URL |
|---|---------|-----|
| 1 | `bun run dev` | http://localhost:3000 |
| 2 | `bun run realtime` | http://localhost:3001 |
| 3 | `clancode` (from your repo) or `cd clan-cli && bun run dev:clan -- --repo ..` | — |

Sign in → `/dashboard` → **Clan Castle** → Plan or Build task. Approve risky actions at the **Approval Gate**. See [docs/demo.md](docs/demo.md) for the safe two-run demo (`demo-obsolete.txt`).

---

## How it works

```text
Web (Clerk + village UI) → gateway :3001 → clancode CLI → TrueForge → worktree → RunEvents → Neon → island UI
```

| Layer | Role |
|-------|------|
| **Web** | Auth, pairing, task intent, approvals UI, visualization |
| **CLI** | Filesystem, Git, worktrees, policy, TrueForge supervision |
| **TrueForge** | Runtime agent loop (not a hidden second harness) |

**Local-first:** repo files stay on your machine; risky tools need human approval; delivery via **PR**, not direct merge to default branch.

---

## Village = execution dashboard

| Building | Engineering state |
|----------|-------------------|
| Clan Castle | Task dispatch |
| Search Tower | Read / grep / explore |
| Builder Workshop | Code changes |
| Approval Gate | Human checkpoint |
| Validation Forge | Tests / typecheck |
| PR Harbor | Real `pr.created` only |

---

## TrueForge

TrueForge owns sessions, streamed turns, tool calls, and MCP lifecycle. ClanCode adds repository boundaries, isolated worktrees, approval UX, structured events, and the web game projection.

---

## Validation

```bash
bun run test:pairing && bun run test:game
cd clan-cli && bun test && bun run typecheck
```

---

## Qodo Code Review Evidence

### [PR #19](https://github.com/ANAMASGARD/ClanCode/pull/19) — Device pairing

Credential bundle fixes, gateway `runDetached`, pairing validation, fail-closed API errors, expiry races — fixed in [`f6eba20`](https://github.com/ANAMASGARD/ClanCode/commit/f6eba20).

### [PR #18](https://github.com/ANAMASGARD/ClanCode/pull/18) — CLI harness

TrueForge supervisor, allowlisted Socket.IO events, npm-ready `@clancode/cli` — Qodo security/correctness fixes in [`520a0b6`](https://github.com/ANAMASGARD/ClanCode/commit/520a0b6).

### [PR #23](https://github.com/ANAMASGARD/ClanCode/pull/23) — Run harness + island UI

Relay 503 handling, ordered run events, device-scoped projection, reset fail-closed, timeline fixes.

---

## License & assets

CLI: **AGPL-3.0-or-later** ([clan-cli/packages/cli/LICENSE](clan-cli/packages/cli/LICENSE)). Kenney kits: CC0 under `public/assets/`. No repo-wide LICENSE yet for the monorepo.

---

## AI disclosure

Built with AI coding assistants under human direction ([AGENTS.md](AGENTS.md)). Runtime agents inside ClanCode follow TrueForge + ClanCode policy, not `AGENTS.md`.

**Troubleshooting:** [docs/troubleshooting.md](docs/troubleshooting.md)
