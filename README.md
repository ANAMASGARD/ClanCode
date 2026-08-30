<p align="center">
  <strong>ClanCode</strong><br/>
  <em>Turn AI coding into a living clan.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@clancode/cli">
    <img src="https://img.shields.io/npm/v/@clancode/cli?style=for-the-badge&logo=npm&logoColor=white&labelColor=CB3837&color=281637" alt="@clancode/cli on npm" />
  </a>
  &nbsp;
  <a href="https://www.npmjs.com/package/@clancode/cli">
    <img src="https://img.shields.io/badge/Install-@clancode%2Fcli@next-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm install @clancode/cli@next" />
  </a>
  &nbsp;
  <a href="https://youtu.be/istUU5onLCI">
    <img src="https://img.shields.io/badge/Watch-Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube demo" />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@clancode/cli">
    <img src="https://upload.wikimedia.org/wikipedia/commons/d/db/Npm-logo.svg" alt="npm" width="72" />
  </a>
  &nbsp;&nbsp;
  <a href="https://www.npmjs.com/package/@clancode/cli"><strong>@clancode/cli</strong></a>
  &nbsp;·&nbsp;
  <a href="https://youtu.be/istUU5onLCI"><strong>Demo video</strong></a>
</p>

<p align="center">
  <a href="https://youtu.be/istUU5onLCI">
    <img src="https://img.youtube.com/vi/istUU5onLCI/hqdefault.jpg" alt="ClanCode demo — task from Clan Castle to PR delivery" width="640" />
  </a>
  <br/>
  <sub>▶ Click to watch: Clan Castle → TrueForge on your laptop → Approval Gate → validation → PR</sub>
</p>

---

Local-first AI coding harness: a **Next.js control plane** pairs with the **`clancode` CLI** on your machine. **[TrueForge](https://trueforge.dev)** runs agents locally; the clan **village visualizes real `RunEvent`s** — it never grants permissions or invents Git results.

## Install CLI

> **[Bun](https://bun.sh) ≥ 1.4**, **Node ≥ 22.14**, **Git**, and a **TrueForge** model. `npm install -g` does not install Bun.

<p align="center">
  <a href="https://www.npmjs.com/package/@clancode/cli">
    <img src="https://img.shields.io/npm/v/@clancode/cli?logo=npm&logoColor=white&label=npm%20package" alt="npm version" />
  </a>
</p>

```bash
npm install -g @clancode/cli@next
# or: bun add -g @clancode/cli@next

clancode doctor
clancode login      # pair once with the web app
clancode            # from your target Git repo (or --repo PATH)
```

Package: **[npmjs.com/package/@clancode/cli](https://www.npmjs.com/package/@clancode/cli)** · Source install: [docs/local-cli-from-source.md](docs/local-cli-from-source.md)

## Quick start (full stack)

```bash
git clone https://github.com/ANAMASGARD/ClanCode.git && cd ClanCode
bun install && cd clan-cli && bun install && cd ..
cp .env.example .env.local   # Clerk, Neon, PAIRING_DELIVERY_KEY, CLANCODE_REALTIME_RELAY_SECRET
bun run db:migrate
```

| # | Terminal | URL |
|---|----------|-----|
| 1 | `bun run dev` | http://localhost:3000 |
| 2 | `bun run realtime` | http://localhost:3001 |
| 3 | `clancode` or `cd clan-cli && bun run dev:clan -- --repo ..` | — |

Sign in → `/dashboard` → **Clan Castle** → Plan or Build. Approve risky actions at the **Approval Gate**. Safe demo script: [docs/demo.md](docs/demo.md).

## How it works

```text
Web (Clerk + village) → gateway :3001 → clancode CLI → TrueForge → worktree → RunEvents → Neon → island UI
```

| Layer | Role |
|-------|------|
| **Web** | Auth, pairing, task intent, approvals UI, visualization |
| **CLI** | Filesystem, Git, worktrees, policy, TrueForge supervision |
| **TrueForge** | Runtime agent loop (not a hidden second harness) |

**Local-first:** repo files stay on your machine; risky tools need human approval; delivery via **PR**, not direct merge to default branch.

## Village = execution dashboard

| Building | Engineering state |
|----------|-------------------|
| Clan Castle | Task dispatch |
| Search Tower | Read / grep / explore |
| Builder Workshop | Code changes |
| Approval Gate | Human checkpoint |
| Validation Forge | Tests / typecheck |
| PR Harbor | Real `pr.created` only |

## Docs

| | |
|---|---|
| [docs/quickstart.md](docs/quickstart.md) | Clone → running in ~15 min |
| [docs/demo.md](docs/demo.md) | Two-run approval demo |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common failures |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Trust boundaries |
| [AGENTS.md](AGENTS.md) | Rules for AI assistants developing ClanCode |
| [memory/memory.md](memory/memory.md) | Current implementation status |

## Validation

```bash
bun run test:pairing && bun run test:game
cd clan-cli && bun test && bun run typecheck
```

## Qodo review evidence

| PR | Scope |
|----|-------|
| [#19](https://github.com/ANAMASGARD/ClanCode/pull/19) | Device pairing — fail-closed API, gateway fixes |
| [#18](https://github.com/ANAMASGARD/ClanCode/pull/18) | CLI harness — TrueForge supervisor, `@clancode/cli` |
| [#23](https://github.com/ANAMASGARD/ClanCode/pull/23) | Run harness + island UI — relay, ordered events, projection |

## License & assets

CLI: **AGPL-3.0-or-later** ([LICENSE](clan-cli/packages/cli/LICENSE)). Kenney kits: CC0 under `public/assets/`. Monorepo: no repo-wide LICENSE yet.

---

<p align="center">
  <a href="https://www.npmjs.com/package/@clancode/cli"><img src="https://img.shields.io/npm/v/@clancode/cli?style=flat-square&logo=npm&logoColor=white&color=CB3837" alt="npm" /></a>
  &nbsp;
  <a href="https://youtu.be/istUU5onLCI"><img src="https://img.shields.io/badge/YouTube-Demo-red?style=flat-square&logo=youtube" alt="YouTube" /></a>
  &nbsp;
  <a href="https://github.com/ANAMASGARD/ClanCode"><img src="https://img.shields.io/badge/GitHub-ClanCode-181717?style=flat-square&logo=github" alt="GitHub" /></a>
</p>

<p align="center"><sub>Built with AI coding assistants under human direction. Runtime agents follow TrueForge + ClanCode policy.</sub></p>
