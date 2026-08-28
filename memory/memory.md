# Clan Code — Project Memory

Last updated: 2026-08-28 (TrueForge runtime adapter + smoke test)

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

OpenTUI presentation scaffold plus a TrueForge runtime adapter. Clan Code wraps
and supervises TrueForge (users run `clancode` eventually, not `npx
@truefoundry/trueforge` directly). Device pairing, run supervisor, repo
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
        ├── scripts/
        │   └── trueforge-smoke.ts
        └── src/
            ├── main.tsx      # OpenTUI renderer/bootstrap only
            ├── app/
            │   └── shell.tsx # TUI shell composition
            ├── components/
            │   └── header.tsx
            ├── commands/
            │   └── index.ts  # Typed argv resolution placeholder
            └── trueforge/
                ├── config.ts # env + Node preflight + CLI path resolution
                └── runtime.ts # ensureRuntime / health / SDK auth.me / stop
```

### Stack

| Piece | Choice |
|-------|--------|
| Runtime / package manager | Bun |
| Workspace | `packages/*` monorepo under `clan-cli/` |
| TUI framework | `@opentui/core` + `@opentui/react` |
| UI library | React 19 (JSX intrinsic elements: `box`, `ascii-font`, etc.) |
| TypeScript | Strict, ESNext, bundler resolution, no emit |
| TrueForge server | `@truefoundry/trueforge@0.1.4` (exact pin; Node >= 22.14) |
| TrueForge SDK | `@truefoundry/trueforge-sdk@0.1.3` (exact pin) |

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
8. **TrueForge runtime adapter** — `src/trueforge/config.ts` + `runtime.ts`.
   Spawns TrueForge under Node with `STANDALONE=true` on loopback, or attaches
   to an already-running local server. Smoke: `bun run trueforge:smoke` verifies
   Node preflight, `/healthz`, and SDK `auth.me()`. Model providers must be
   configured in TrueForge Settings before agent turns (next milestone).

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
- TrueForge run supervisor (adapter exists; supervisor layer next)
- Structured event streaming to web (`RunEvent` protocol)
- Isolated branch/worktree workflow
- Safe tool execution (read / reversible write / sensitive)
- Commit, push, PR creation
- Offline / fail-closed behavior

---

## Web App — Current State

Next.js app from the Create Next App scaffold under `app/`. Game/clan
visualization and control-plane APIs are not yet implemented in depth.

### Clerk user authentication

- Web user auth is Clerk (`@clerk/nextjs`) in the Next.js control plane.
- `/` is public: a blank landing with a Dashboard button only. No always-visible
  sign-in/up chrome.
- Unsigned Dashboard clicks open a Clerk sign-in/sign-up modal over a blurred,
  transparent landing overlay. Clicking the blur (or Escape) closes it.
  After a successful sign-in or sign-up, the user is sent to `/dashboard`.
- `/dashboard` is protected. Unauthenticated visits redirect to `/?auth=1`,
  which reopens the same landing modal.
- Dashboard is currently a blank “Coming soon” page with a `UserButton`.
- `proxy.ts` matcher includes `'/(api|trpc)(.*)'` and `'/__clerk/:path*'`.
- Clerk secrets live in `.env.local` (gitignored). Do not log or commit them.

### Neon PostgreSQL + Drizzle (web control plane only)

- **Clerk** is the only user authentication layer. **Neon is database only** — no Neon
  Auth product, no Neon-managed sign-in, no auth env vars from Neon.
- Hosted persistence uses **Neon PostgreSQL + Drizzle ORM** (`DATABASE_URL`).
- Code: `app/lib/db/` (`getDb()`), schema barrel, migrations in `drizzle/`.
- Neon CLI (`neon` devDependency) links the repo and pulls postgres env only:
  - `neon:login` — Neon **CLI** sign-in (developer tool, not app auth)
  - `neon:setup` — link project `flat-resonance-41016361` + pull postgres env
  - `neon:env` — refresh DB vars in `.env.local` (preserves Clerk keys)
  - `db:check` — verify Drizzle can query Neon
- Linked context: `.neon` (org/project/branch). `db:generate`, `db:migrate`,
  `db:studio` for schema work.
- `clan-cli` / TrueForge keeps its own local SQLite — do not add Drizzle/Neon there.
- No domain tables yet (islands, buildings, tasks, runs). Schema comes next.
- **Verified locally:** `bun run db:check` succeeds against Neon project
  `flat-resonance-41016361` (`production` branch). `.neon` context is gitignored;
  secrets stay in `.env.local` only.

### Visualization foundation

- Canonical asset inventory: [`memory/visualization-assets.md`](visualization-assets.md).
- Kenney kits are under `public/assets/`: Fantasy Town 2.0, Nature 2.1,
  Pirate 2.1, and Survival 2.0.
- Clash Display font files are under `public/fonts/`.
- The main theme and click/select feedback are under `public/audio/`.
- `app/lib/visualization/kenney.ts` owns typed Kenney public URLs.
- `app/lib/visualization/audio.ts` owns typed audio URLs and the client
  controller for looping theme, mute state, and click feedback.
- The Next.js root now includes `three@0.185.1`,
  `@react-three/fiber@9.7.0`, `@react-three/drei@10.7.8`,
  `gsap@3.15.0`, `framer-motion@13.1.1`, and
  `@types/three@0.185.4`.
- Root `tsconfig.json` excludes `clan-cli`; the nested CLI workspace remains
  independently typechecked.
- No 3D scene, HUD mute control, loader integration, or physics world exists
  yet. WebGL/audio failure must remain non-fatal when these are built.

---

## Other WIP Paths

| Path | Notes |
|------|-------|
| `clan-cli/` | CLI scaffold and nested Bun workspace (see above) |
| `memory/` | Project-local durable context and asset catalog |
| `public/assets/` | Four Kenney CC0 kit trees (Fantasy Town, Nature, Pirate, Survival) |
| `public/audio/` | `Clan Code - Main Theme.m4a` and `click-003.mp3` |
| `public/fonts/` | `Clash_Bold.otf.ttf`, `Clash_Regular.otf.ttf` — brand fonts for web HUD |
| `.env.example` | Documents Clerk keys + `DATABASE_URL` (no secrets) |
| `scripts/` | `db-check.ts`, `db-migrate.ts` for Drizzle/Neon |

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
