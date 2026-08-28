# Clan Code CLI

The local execution-plane CLI for Clan Code. Clan Code wraps and supervises
TrueForge as the agent runtime harness — users run `clancode` (future), not
`npx @truefoundry/trueforge` directly.

Currently implemented:

- OpenTUI/React terminal presentation scaffold
- TrueForge runtime adapter (`src/trueforge/`) — spawn/attach, health, SDK

Planned layers: device pairing, repository execution, policy enforcement, run
supervisor, website bridge, and Git/PR workflow.

## Requirements

- **Bun** — CLI development and TUI (`bun run dev`)
- **Node.js >= 22.14.0** — TrueForge local server process (spawned by the runtime adapter)

## Development

From this directory:

```bash
bun install
bun run dev:clan
```

For package-local development:

```bash
cd packages/cli
bun run dev
```

## TrueForge smoke test

Verifies Node preflight, TrueForge package resolution, spawn/attach, `/healthz`,
and SDK `auth.me()` connectivity:

```bash
bun run trueforge:smoke
```

Configure TrueForge model providers at http://127.0.0.1:8790 before running
agent turns (next milestone).
