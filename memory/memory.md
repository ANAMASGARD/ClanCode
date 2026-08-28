# Clan Code — Project Memory

Last updated: 2026-08-28

## What This Repo Is

Clan Code is a local-first AI coding harness:

- **Web app (`app/`)** — Next.js control plane: auth, repo selection, clan UI, tasks, approvals, run timeline.
- **CLI (`clan-cli/`)** — Intended local execution plane; the current implementation is only the OpenTUI/React presentation scaffold.
- **TrueForge** — Runtime agent harness (not yet wired in CLI).
- **Delivery** — Agent changes go through isolated branches → PR → Qodo review → human merge.

Stable contracts live in `ARCHITECTURE.md` and `AGENTS.md` (initially committed on `main` as `4e6144e`).
The architecture-doc alignment and CLI scaffold cleanup are committed locally under
`docs: align architecture with clan-cli scaffold and CLI layers`.

## Architecture Boundary (short)

> The web app expresses intent and visualizes state; the paired local CLI executes inside an approved repository; TrueForge runs the agents; policy gates their tools; risky actions require a human; and code reaches the default branch only through a reviewed pull request.

Do not move filesystem/shell/Git execution into the Next.js app.

---

## clan-cli — Current State

### Status

Early scaffold only. The CLI renders a terminal UI shell with branding and now
keeps bootstrap, TUI composition, presentation components, and command
resolution in separate modules. Device pairing, TrueForge integration, repo
resolver, policy engine, safe execution tools, and Git/PR workflow are not
implemented yet.

### Layout

```text
clan-cli/
├── package.json              # Independent Bun workspace root
├── bun.lock
├── tsconfig.base.json        # Shared strict TS config
├── README.md                 # CLI scope and development notes
└── packages/
    └── cli/                  # @clanofagents/cli
        ├── package.json
        ├── tsconfig.json     # JSX via @opentui/react
        └── src/
            ├── main.tsx      # OpenTUI renderer/bootstrap only
            ├── app/
            │   └── shell.tsx # TUI shell composition
            ├── components/
            │   └── header.tsx
            └── commands/
                └── index.ts  # Typed argv resolution placeholder
```

### Stack

| Piece | Choice |
|-------|--------|
| Runtime / package manager | Bun |
| Workspace | `packages/*` monorepo under `clan-cli/` |
| TUI framework | `@opentui/core` + `@opentui/react` |
| UI library | React 19 (JSX intrinsic elements: `box`, `ascii-font`, etc.) |
| TypeScript | Strict, ESNext, bundler resolution, no emit |

### What Exists Today

1. **Workspace bootstrap** — `clan-cli/package.json` with
   `workspaces: ["packages/*"]` and script `dev:clan`; it is a separate package
   root from the Next.js app.
2. **CLI package** — `@clanofagents/cli`, private, ESM (`"type": "module"`).
3. **Entry (`main.tsx`)** — Creates the OpenTUI CLI renderer with explicit
   Ctrl-C handling, mounts the React root through the supported
   `@opentui/react/renderer` entrypoint, and delegates to `Shell`.
4. **Shell (`app/shell.tsx`)** — Owns the full-screen dark TUI layout
   (`#0D0D12`) and renders `Header`.
5. **Header component** — Centered ASCII-art title: "Clan" (gold `#FFD54A`) +
   "Code" using `ascii-font` / `tiny` font.
6. **Command placeholder (`commands/index.ts`)** — Resolves the future `ui`,
   `pair`, `run`, and `status` command names without executing them. Unknown
   commands are represented explicitly.
7. **Tooling** — `.gitignore`, shared `tsconfig.base.json`, package-level
   tsconfig with `jsxImportSource: "@opentui/react"`, and a package
   `typecheck` script.

### How to Run (local dev)

From repo root:

```bash
cd clan-cli
bun install
bun run dev:clan
```

Or from the CLI package:

```bash
cd clan-cli/packages/cli
bun run dev
```

Both use `bun run --watch` on `main.tsx`.

### Not Built Yet (planned per ARCHITECTURE.md)

- Device pairing with web control plane
- Repository resolver / validation
- Policy engine and approval gates
- TrueForge run supervisor
- Structured event streaming to web (`RunEvent` protocol)
- Isolated branch/worktree workflow
- Safe tool execution (read / reversible write / sensitive)
- Commit, push, PR creation
- Offline / fail-closed behavior

---

## Web App — Current State (brief)

Next.js app from Create Next App scaffold under `app/`. Game/clan visualization and control-plane APIs are not yet implemented in depth.

---

## Other Untracked / WIP Paths

| Path | Notes |
|------|-------|
| `clan-cli/` | CLI scaffold and nested Bun workspace (see above) |
| `memory/` | This file; project-local durable context |
| `public/fonts/` | `Clash_Bold.otf.ttf`, `Clash_Regular.otf.ttf` — brand fonts for web UI |

---

## Conventions to Follow When Extending clan-cli

- Keep all filesystem, shell, Git, and process execution in `clan-cli/`, not in Next.js routes.
- Use Bun only; do not add npm/yarn/pnpm lockfiles.
- Prefer argument-array process APIs over shell string concatenation.
- Emit structured run events; do not make TUI animation state the source of truth.
- Classify tools as read-only, reversible write, or sensitive/destructive (approval required).
- Never push to default branch or auto-merge from the CLI.

See `AGENTS.md` sections 9–12 and `ARCHITECTURE.md` sections 6–11 for full rules.

---

## Suggested Next Steps for clan-cli

1. Turn the command-resolution placeholder into explicit `pair`, `run`, and
   `status` command handlers without putting policy in TUI components.
2. Define shared protocol types (`RunEvent`, task/run state) in a lightweight
   package if needed by web + CLI.
3. Integrate TrueForge as the agent runtime behind a thin supervisor.
4. Implement repository validation and isolated worktrees before any write
   tools.
5. Add policy, approval, cancellation, and structured event streaming before
   external GitHub delivery.
