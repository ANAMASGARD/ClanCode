# ClanCode — Project Memory

Last updated: 2026-08-29 (ClanCode CLI finalization)

## What This Repo Is

ClanCode is a local-first AI coding harness:

- **Web app (`app/`)** — Next.js control plane: auth, repo selection, clan UI, tasks, approvals, run timeline.
- **CLI (`clan-cli/`)** — Local execution plane: `clancode` wraps TrueForge via a run supervisor.
- **TrueForge** — Runtime agent harness (sessions, turns, streaming, MCP). ClanCode does not replace it.
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

Local `clancode` harness: run supervisor, repository boundary, polyglot search
(rg-first + git ls-files Bun fallback), targeted apply_patch, Plan/Build MCP
tools over loopback MCP, isolated `clancode/*` worktrees, process runner,
approvals, multi-id session mapping with model preferences, OpenTUI chat,
validation, Git/PR delivery, outbound Socket.IO client (`clancode connect`),
npm-ready `@clancode/cli` packaging, `doctor` / `run`.
TrueForge adapter is preserved (connect-level runtime manager; attach/spawn,
never kill attached). Model providers must still be configured in TrueForge
(or `CLAN_TRUEFORGE_MODEL`) for live agent turns.

### Layout

```text
clan-cli/
├── package.json
├── bun.lock
├── tsconfig.base.json
├── README.md
└── packages/
    ├── protocol/             # RunEvent v1 (eventId + sequence)
    └── cli/                  # @clancode/cli → bin clancode
        ├── src/supervisor/
        ├── src/repository/
        ├── src/worktree/
        ├── src/tools/
        ├── src/process/
        ├── src/mcp/
        ├── src/git/
        ├── src/search/
        ├── src/realtime/
        ├── src/session/
        ├── src/doctor/
        ├── src/cli/
        └── src/trueforge/    # preserved adapter
```

### What Exists Today

1. **Run supervisor** — attach/spawn TrueForge, cancel/stop (spawned only), RunEvents.
2. **Repository boundary** — `resolveWithinRepo` via realpath, not string prefix.
3. **TrueForge sessions** — inline AgentSpec, `createTurnStream`, `sessions.cancel`.
4. **Plan/Build MCP tools** — loopback `127.0.0.1` Streamable HTTP JSON-RPC.
5. **Worktrees** — `clancode/<slug>-<id>` outside the user checkout (XDG state).
6. **Approvals** — TrueForge `tool.approval_required` → `user.tool_approval`.
7. **Production CLI** — `clancode`, `clancode run`, `clancode doctor [--json]`, `clancode connect`.
8. **Socket.IO client** — outbound `command`/`event` transport; persisted command-id journal; allowlisted run projection.
9. **npm package** — `@clancode/cli@0.1.0-beta.1`, `dist/cli.js` bin with Bun shebang.

### How to Run (local dev)

```bash
cd clan-cli
bun install --ignore-scripts
bun run --cwd packages/cli start
# or: bun run --cwd packages/cli doctor
```

Pack locally: `bun run --cwd packages/cli pack:local`

### Not Built Yet

- Website Socket.IO server and device pairing UI
- Website 3D game visualization
- npm registry publish (package is publication-ready; scope/license are human blockers)
- Remote PR smoke without `gh` authentication

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
