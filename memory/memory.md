# ClanCode — Project Memory

**Last updated:** 2026-08-30 (video landing hero, Qodo harness fixes, session logs, construction viz)

## What This Repo Is

ClanCode is a local-first AI coding harness:

- **Web app (`app/`)** — Next.js control plane: Clerk auth, device pairing, clan island, command dock, Neon/Drizzle persistence. Commands go through `/api/clan/*`; the web app does **not** execute tools or write run projections directly (gateway relay → CLI).
- **CLI (`clan-cli/`)** — Local execution plane (`@clancode/cli`). Users run `clancode`, not TrueForge directly.
- **TrueForge** — Runtime agent harness via `RunSupervisor`.
- **Realtime gateway** — Loopback `:3001`. Internal `POST /internal/command` plus Socket.IO to the paired CLI. Gateway is the writer of `clan_run_projections` from sanitized `RunEvent`s.
- **Delivery** — Agent changes go through isolated branches → human-confirmed PR → Qodo review → human merge.

Stable contracts: `ARCHITECTURE.md`, `AGENTS.md`. Volatile status lives here.

## Architecture Boundary (short)

> The web app expresses intent and visualizes state; the paired local CLI executes inside an approved repository; TrueForge runs the agents; policy gates their tools; risky actions require a human; and code reaches the default branch only through a reviewed pull request.

Do not move filesystem/shell/Git execution into the Next.js app.

## Milestone: TrueForge run visualization (active)

Island builders, Approval Gate, PR Courier, and Builder Workshop construction site are driven by a single Neon snapshot of sanitized `RunEvent`s.

### What works now

| Flow | Status |
|------|--------|
| Dispatch / cancel / approve / create-PR from Clan Command Dock (Castle rail) | ✅ |
| Voice task input (OpenAI transcription via `/api/clan/transcribe`) | ✅ |
| Scrollable activity log with phase/tool/event deltas | ✅ |
| **Restart harness** — archives activity, cancels stale run, resets projection to idle | ✅ |
| Stale-run detection (`planning` + `task.start` + `lastSequence === 0`) with user hint | ✅ |
| Clickable PR links in web activity panel | ✅ |
| **Delete building** — click island decoration or optional semantic building → red Delete in side panel | ✅ |
| **Re-add building** — removed items appear in bottom-left tray; restore at original tile | ✅ |
| **Session history popup** — ◫ rail or Session Lodge → archived runs + chat/activity lines | ✅ |
| Construction site at workshop (3D scaffolding, no DOM overlay) | ✅ |
| Workshop +1 storey only for unique successful **Build** with `changed` and validation passed/skipped (cap 4) | ✅ |
| Layout edit (✥) enabled during runs; decorative remove-on-click in edit mode | ✅ |
| Cancel run (red button) relays to shared CLI supervisor | ✅ |

### Session log archive

When a run is **restarted**, **cancelled**, or `/new` in the CLI:

- **Web (Neon):** `clan_run_session_logs` — archived activity lines + run metadata (`drizzle/0003_clan_run_session_logs.sql`, index in `0004`).
- **CLI (local):** `$XDG_STATE_HOME/clancode/session-logs/*.json` — full TUI transcript via `archiveRunLog()`.

API: `POST /api/clan/run/reset` — tries cancel, archives activity payload, calls `resetRunProjection()`.  
API: `GET /api/clan/session-logs` — lists archived sessions for the signed-in user (newest first).

Protected semantic buildings (cannot delete): Clan Castle, Approval Gate, Builder Workshop, Validation Forge, Test Camp.

### Qodo PR #23 harness fixes (2026-08-30)

| Finding | Fix |
|---------|-----|
| Control commands reset projection | `onAccepted` / `seedAcceptedTask` only on `task.start` |
| Run events out-of-order | Per-`clerkUserId` `enqueueRunEvent()` chain in gateway |
| Secondary device replaces active run | `applyRunEvent` ignores non-selected `deviceId` |
| Relay outages → HTTP 500 | `relayClanCommand` maps network failure to `503 relay_unavailable` |
| Reset masks relay rejection | Reset route fails closed unless `device_offline` |
| Archive failures silent | CLI logs stderr + user-visible message on archive failure |
| Failure timeline wrong stage | `terminalTimeline()` / `inferTerminalStep()` in `run-timeline.ts` |

### Landing page (public `/`)

GramSarthi-inspired full-viewport hero using `public/video/Clan-Code-Hero.mp4`:

- **Video background** — autoplay muted loop; light top/bottom vignette only (no heavy grey wash); title high, copy/CTA low so the island stays visible in the centre.
- **Copy** — Clash Display headline “Build Your Code Kingdom”, feature pills, glass **Begin Journey** / **Enter Dashboard** CTA.
- **Auth** — header Sign in / Sign up (or Dashboard + UserButton when signed in); CTA opens Clerk modal; `?auth=1` still supported.
- **Audio** — click anywhere on the hero to unmute (browser autoplay policy); hint badge until enabled.
- **Component** — `app/components/landing-hero.tsx`; styles in `app/globals.css` (`.landing-*`).

### CLI transcript improvements

- Structured events use `formatRunEventLine()` — PR shows full URL, number, branch, and `repo=` path.
- `/new` and `/cancel` archive transcript before clearing; path printed in system line.

### Projection rules (unchanged)

- `requestedMode` seeded from accepted `task.start`, never from `run.started.payload.mode`.
- Gate opens only on real `approval.granted`. Ship sails only on real `pr.created`.
- Demo file: `demo-obsolete.txt`.

### Env

- `CLANCODE_REALTIME_RELAY_SECRET`, `CLANCODE_REALTIME_INTERNAL_URL=http://127.0.0.1:3001`
- Optional `CLANCODE_COMMAND_ACK_TIMEOUT_MS` (default 45000)
- Optional `OPENAI_API_KEY` for voice in command dock

### Migrations

- `drizzle/0002_clan_run_projections.sql`
- `drizzle/0003_clan_run_session_logs.sql` + `0004_clan_run_session_logs_idx.sql` (Neon requires one statement per migration file)

Apply: `bun run db:migrate`

### Validation (2026-08-30)

| Check | Result |
|-------|--------|
| `bun test` (web root, all suites) | 244 pass |
| `bun run test:pairing` | included above |
| `bun run test:game` | included above |
| `bun run game:assets:check` | 366 verified GLBs |
| `bun run lint` | pass (0 errors, pre-existing warnings) |
| `bun run build` (web) | pass |
| `clan-cli` `bun test` + `typecheck` + `build` | 97 pass, pass, pass |

---

## Milestone: CLI harness complete (PR #18)

**Merged:** `4b0b921` on `main`. Package `@clancode/cli@0.1.0-beta.1`, binary `clancode`.

Local AI harness is feature-complete for hackathon scope. **Stop adding general coding-agent features to the CLI** unless architecture explicitly requires it.

---

## Merged milestone: Web control-plane pairing (PR #19)

**Merged on `main`:** Clerk + device pairing + live CLI presence + TUI polish.

### What works now

| Flow | Status |
|------|--------|
| Clerk user auth (linked app `app_3IXcn0Ap17Yw14c5AcYZYb5mws8`) | ✅ |
| **Video landing hero** at `/` with Clerk sign-in and dashboard CTA | ✅ |
| `clancode login` / `clancode pair` | ✅ (also runs automatically on first `clancode` / `dev:clan` launch) |
| Browser `/pair?code=XXXX` approve / deny | ✅ |
| One-time AES-GCM device token delivery | ✅ |
| Pairing approve/poll without Neon HTTP transactions | ✅ (sequential queries; no `db.transaction()`) |
| TUI auto-connects to Socket.IO `:3001` after pairing | ✅ (`--offline` skips) |
| `clancode connect` as optional dedicated presence process | ✅ |
| `device.hello` / `device.heartbeat` via `"event"` envelope | ✅ |
| Dashboard device list + green **Connected** when heartbeat fresh (45s TTL) | ✅ |
| CLI header green `● control=connected` chip (separate from `agent=`) | ✅ |
| Revoke device (fail-closed on connect/heartbeat) | ✅ |
| OpenTUI yellow theme + centered CLANCODE title + island ASCII art | ✅ |
| Clerk middleware migration (resource-based auth in dashboard layout) | ✅ |

### Status semantics (important)

Two independent indicators:

| Indicator | Meaning |
|-----------|---------|
| **`agent=ready`** (CLI) | Local TrueForge harness idle; not web connectivity |
| **`control=connected`** (CLI) | Socket.IO link to realtime gateway active |
| **Dashboard Connected** | Device heartbeat within 45s TTL |

**Desired flow:** pair once in browser → credentials persist in `credentials.json` → reboot → run `clancode` → auto Socket.IO connect → green on dashboard + CLI. No second login.

### Pairing model

- **Clerk** authenticates the human in the browser only.
- **ClanCode device token** is opaque, revocable, stored locally in `$XDG_STATE_HOME/clancode/credentials.json` (`0600`).
- Neon stores **SHA-256(token)** only; raw token is encrypted in `pairing_deliveries` until one-time poll consume.
- Device lifecycle: `pending` (after browser approve) → `active` (after CLI poll) → `revoked`.
- Challenge lifecycle: `pending` → `approved`/`denied`/`expired`/`consumed`.

### Qodo review fixes included in PR #19

All nine Qodo threads addressed in code:

| Finding | Fix |
|---------|-----|
| Token + deviceId + URL mixing | `resolveRealtimeCredentials()` — atomic stored bundle or full env triple (`CLANCODE_DEVICE_TOKEN` + `CLANCODE_CONTROL_URL` + `CLANCODE_DEVICE_ID`) |
| Gateway async failures | `app/lib/realtime/gateway.ts` — `runDetached()` catches all async paths; presence tracked after DB write |
| Gateway untested | `app/lib/realtime/gateway.test.ts` — auth, presence, heartbeat, mismatch, revocation |
| Pair poll input validation | `app/lib/pairing/validation.ts` — strict deviceCode/userCode/deviceId formats |
| Raw API error leakage | `app/lib/pairing/api-errors.ts` — generic `internal_error` + requestId, server-side log |
| Approval/expiry race | `approvePairingChallenge` / `denyPairingChallenge` — `gte(expiresAt, now)` in UPDATE WHERE |
| openBrowser fallback | `login.ts` — wait for `spawn` event before resolve |
| slow_down ignored | `login.ts` — exponential backoff up to 8× interval |
| Production gateway monolith | `scripts/realtime-server.ts` → thin wrapper over `createRealtimeGateway()` |

PR #19 is merged. Its historical manual-E2E and Qodo notes below are retained as validation context, not as an active merge gate.

### Bug fixes in this slice

1. **`/api/pair/approve` 500** — Neon HTTP driver lacks transactions; `approvePairingChallenge` and `pollPairingChallenge` rewritten as sequential queries.
2. **Dashboard Offline while CLI `ready`** — CLI was not connecting to Socket.IO by default; `startControlPlaneLink()` now runs from TUI when paired.
3. **Clerk deprecation** — `proxy.ts` simplified to `clerkMiddleware()`; `auth.protect()` moved to `app/dashboard/layout.tsx`.

### Dev commands

```bash
# Terminal 1 — Web (port 3000)
bun run dev

# Terminal 2 — Realtime gateway (port 3001)
bun run realtime

# Terminal 3 — CLI (pairs once, then auto-connects)
cd clan-cli && bun run dev:clan
# local-only harness without web: bun run dev:clan -- --offline
# explicit pairing: bun run --cwd packages/cli start login
```

### Required env (web `.env.local`)

- Clerk keys (existing)
- `DATABASE_URL` (Neon)
- `PAIRING_DELIVERY_KEY` — 32-byte base64url secret for AES-GCM delivery
- Optional: `CLANCODE_WEB_URL`, `CLANCODE_REALTIME_URL`, `CLANCODE_REALTIME_PORT`

Generate delivery key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Socket.IO contract (locked)

```text
auth: { token }
socket.emit("event", ClientEventEnvelope)
socket.on("command", ...)
```

Production Socket.IO host is **decision later** (local Bun `:3001` for development; Vercel WebSockets are possible with instance-pinned Fluid compute but need reconnect/durable presence design).

### Validation (2026-08-29, post-Qodo fixes)

| Check | Result |
|-------|--------|
| `bun run test:pairing` (web pairing + gateway) | 15 pass |
| `bun run build` (web) | pass |
| `bun run lint` | pass (0 errors) |
| CLI typecheck + `bun test src` | 77 pass |
| CLI `bun run build` | pass |
| Manual E2E (login/approve/connect/revoke/deny) | **pending human run** |
| Qodo unresolved threads | **pending re-review** |

### Validation (2026-08-29, earlier)

| Check | Result |
|-------|--------|
| `bun run test:pairing` (web) | 6 pass |
| `bun run build` (web) | pass |
| `bun run lint` | pass (after dist ignore + lint fixes) |
| `clan-cli/packages/cli` typecheck | pass |
| `bun test src` (CLI) | 75 pass |
| `bun run build` (CLI) | pass |

### Not built yet (future control-plane milestone)

1. **Task composer → `task.start` → RunEvents in browser → approval UI → PR result**
2. Neon domain tables (repositories, tasks, runs, run_events, approvals)
3. npm registry publish

---

## Active milestone: Clash-style plot scene + village (presentation)

**Branch:** `feat/clancode-game-foundation` (in progress on scene layer)

Clash-style plot island with a Kenney village on the gridded grass. The game remains presentation-only: it does not authorize tools, grant approvals, or invent run/PR state.

### Current island (2026-08-30)

- **Terrain** — flat stacked axis-aligned squares (`app/game/scene/terrain/`): dark forest floor clipped at `WATER_EDGE_Z`, medium-green rim, dirt edge, procedural gridded plot shader, clean orange sand band, Kenney blue sea.
- **Sea** — instanced `ground_riverOpen` tiles tinted toward reference blue over a deeper backing plane.
- **Shore** — flat sand + foam strip only.
- **Canopy** — dense instanced Fantasy Town Kit pines (`village.tree*`) mixed with Nature pines, plus Fantasy kit rocks (`village.rock*`). **No trees on the clan plot.** Beach/shore wedge stays open.
- **Beach rampart** — the only plot-perimeter wall. `walls.ts` generates a single instanced `harbor.castleWall` line on the green rim at `BEACH_WALL_Z = 26`, with a centre gate opening, flanking small towers, and `harbor.towerWatch` at both ends. The Approval Gate stands in the opening.
- **Harbor** — `Harbor.tsx` + `shore-layout.ts`: wooden pier, three bobbing Kenney ships plus a rowboat beyond `WATER_EDGE_Z`, crates/barrels/palms, shore lookout tower. Bobbing is disabled under reduced motion.
- **Villagers** — `Villagers.tsx` + `villager-wander.ts`: 10 Kenney **Blocky Characters**. Town-hall clearance is 8.8 world units so they walk around the keep, not through it.
- **Roads** — Town Hall plaza plus a main avenue from the plaza to the beach gate (`roads.ts`).
- **HUD** — Clerk `firstName` / `username` under **ClanCode** (fallback `Island`). Device presence, audio, building directory, and edit-mode toggle. Quest placeholder removed.
- **Lighting/camera** — forest-green background; ortho zoom locked at default. Camera overview is `(42, 48, 42)`.
- **Shared constants** — `app/game/state/island.ts` drives terrain, canopy, water, camera lock, beach-wall geometry, and plot-bounds tests.

### Clan castle (Town Hall) — Castle Kit sample

Town Hall is assembled in `app/game/prefabs/TownHall.tsx` from **Kenney Castle Kit** to match `public/assets/kenney_castle-kit/Sample.png`.

- Kit modules are **1 world unit**. `CELL = 1`. Square storeys stack at `1.01`; hexagon base height is `1.31`.
- **One cell, one piece.** A wall and a tower never share the same cell (that caused the clipped / overcrowded keep).
- **L-courtyard:** north/west/east curtains, east wood-lookout wing, south gatehouse.
- **Gatehouse:** two `wall-corner-half-tower` round turrets, `wall-doorway`, `metal-gate`, wooden `gate`, `bridge-draw`, two `flag-banner-short`.
- **Towers:** tall square keeps with `tower-square-top-roof-high` (steep blue pyramid), inner `tower-slant-roof` gabled keep, inner-corner hexagon with blue conical roof.
- **Dressing:** siege engines, pines, rocks, and logs sit **2–4 units off** the curtains.

**Do not** restore KayKit Medieval Hexagon / Adventurers. Those packs were tried, then deleted: Windows texture paths and GLB padding broke Three.js (`Couldn't load texture {}`). The island is Kenney-only.

### Search Tower (semantic)

Castle Kit hexagon stack at `(0, -8)` — **unchanged silhouette**, corrected module heights (base `1.31`, mid `0.46`, roof `0.83`). GSAP **Y-axis rotating search beam** via `useContinuousRotation`: warm `spotLight` + translucent cone mesh. Static glow when `reducedMotion` is on. Presentation only — does not reflect real search/run state.

### Fantasy Town village set (decorative)

Grass-ring cottages and plaza props from `kenney_fantasy-town-kit_2.0/Sample.png` (castle **not** touched):

- **Red-roof cottage** — `VillageHouseA` / `Cottage`: compact stone/timber, `roof-gable`, chimney, red banner.
- **Teal-roof house** — `VillageHouseD` / `Bakery`: two-storey stone + timber, `roof-high`, green banner/stall accent.
- **Plaza** — `Well` fountain with benches/stools; `MarketCluster` red+green stalls, picnic seating, cart; `StallCorner` north pocket; `CartHay` loaded carts on open grass.
- Default decorative seed adds `Cottage` at `(-8, 10)` and `Bakery` at `(8, 10)` on the south ring.

**Deferred:** villager sit / enter-house / shopkeeper / cart-follow story loops (wander-only for now).

### Standing windmills

Kit `windmill.glb` is a **sail disc** (AABB ~0.47×3.11×3.11), not a tower. Do not use it as the mill body.

`Mills.tsx` builds a standing mill: Fantasy Town `wall-rounded` stone tower + timber storey + `roof-high-point` + four `blade` sails at the hub spinning on **Z**. Semantic mill at `(-10, -4)`; decorative `SmallWindmill` at the four grass corners.

### Village spacing

Semantic and decorative buildings sit on an **8-tile ring** around the origin so cottages are on the grass, not inside the keep. Town Hall footprint is `[12, 12]`.

`mergeSavedLayout` rejects otherwise-valid saves that still crowd the keep (any non-gate placement with Chebyshev distance `< 6` tiles from origin) and falls back to `DEFAULT_SEED_LAYOUT`. Refreshing `/dashboard` picks up the new seed for those packed layouts.

### Clan layout editor

Clash-style **Edit mode** on the gridded plot (presentation-only — does not affect runs, approvals, or CLI):

- **Enter** — ✥ button in `GameHud.tsx` toggles edit mode.
- **Drag** — left-drag a building onto a free tile. Invalid tiles snap back. Right-drag pans. Approval Gate stays in the beach opening.
- **Remove / shop** — decorative and prop items can be removed; `PlacementShop.tsx` lists buildings, decorations, and Kenney props from `placable-catalog.ts`.
- **Fixed** — Approval Gate only; beach rampart, roads, harbor, forest, villagers.
- **Persistence** — `GET`/`PUT` `/api/clan/layout` stores per-Clerk-user JSON in Neon `clan_layouts` (`drizzle/0001_clan_layouts.sql`). The API creates the table if it is missing. Layout edits autosave after a short debounce.
- **Model** — unified `ClanPlacement` union in `clan-layout.ts`; default seed merges semantic + decorative layouts; max 48 user items.

### Catalog (current)

**351** verified GLBs via `bun run game:assets:check`: Fantasy Town 89, Nature 122, Pirate 38, Survival 29, **Castle 44**, Retro Fantasy 11, Blocky Characters 18.

Kits on disk: Fantasy Town, Nature, Pirate, Survival, Castle (`public/assets/kenney_castle-kit/`), Retro Fantasy (`public/assets/kenney_retro-fantasy-kit (1)/`), Blocky Characters. URLs go through `kenneyGlbUrl()` only.

### Plot + village validation (2026-08-30, Sample.png keep)

| Check | Result |
|-------|--------|
| `bun run game:assets:check` | 351 verified GLBs |
| `bun run test:game` | 57 pass |
| `bun run test:clan-layout` | 16 pass |
| Browser `/dashboard` | pending signed-in Clerk session (Search Tower beam + village set) |

**Canopy density (full quality, seed `CANOPY_SEED`):** ~2,064 instanced trees + ~145 Fantasy kit rocks; zero trees on the gridded plot (`PLOT_EXCLUSION_HALF = 24.2`).

### Earlier restyles on this branch (superseded)

These notes are history, not current layout:

- Closed Fantasy Town gatehouse / packed 3-tile lattice — replaced by the Castle Kit L-courtyard and 8-tile ring.
- Hybrid Retro Fantasy keep with **no** curtain walls, windmills removed, Search Tower and Test Camp off the default plot — replaced. Windmills, search tower, and test camp are back on the default seed. The keep **does** use Castle Kit curtains (they are the Town Hall prefab, not a plot-perimeter wall).
- KayKit buildings and adventurers — removed from `public/assets/` and the catalog.

---

## Previous milestone: Clan village visual redesign (superseded scene)

**Branch:** `feat/clancode-village-visual-redesign` (from game foundation)

- Flat irregular grass island replaces rectangular `RoundedBox` slabs; west beach, varied cliff edges, brightened water and sky.
- Asset catalog expanded to **231** curated Kenney GLBs with measured `uniformScale`, `pivotMode`, `district`, and `instanceable` flags.
- Data-driven layout modules: walls, roads, semantic/decorative placements, harbor props.
- Three-sided forest bands with 120+ individual trees; harbor district with ships and lighthouse.
- **Superseded** by the plot scene clone above (empty plot, no harbor, instanced canopy).

### Visual redesign validation (2026-08-30)

| Check | Result |
|-------|--------|
| `bun run game:assets:check` | 231 verified GLBs |
| `bun run test:game` | 11 pass |
| `bun run test:pairing` | 15 pass |
| `bunx tsc --noEmit` | pass |
| `bun run lint` | pass (0 errors) |
| `bun run build -- --webpack` | pass |
| `git diff -- clan-cli` | empty |

---

## Previous milestone: 3D clan game foundation

**Branch:** `feat/clancode-game-foundation`

- Protected `/dashboard` now opens the interactive clan island for the signed-in user.
- `/dashboard/clan` is an alias; device pairing and revocation remain available at `/dashboard/devices`.
- The client-only React Three Fiber scene contains the central semantic village, south-west harbor, normal ship, composed lighthouse, river, bridge, watermill, and a deterministic forest dominated by the eastern edge.
- A typed catalog selects 92 verified GLBs from the four CC0 Kenney kits. `bun run game:assets:check` validates every selected file.
- Orthographic pan, zoom, reset, building focus/selection, adaptive quality, user-gesture audio, loading UI, and a non-WebGL fallback are wired.
- The HUD and scene explicitly remain presentation-only. The production website-to-CLI task composer and real RunEvent stream are not connected in this milestone.
- Rapier placement/editing deferred; **Neon layout persistence shipped** in the layout editor milestone above.

### Implemented foundation inventory

| Area | Current implementation |
|------|------------------------|
| Protected entry route | `/dashboard` opens the game for a signed-in Clerk user |
| Supporting routes | `/dashboard/clan` aliases the game; `/dashboard/devices` retains pairing and revocation |
| Scene loading | Client-only dynamic import with SSR disabled, Suspense progress UI, asset-level error boundary, and textual WebGL fallback |
| Island composition | Layered grass/beach platform, decorative ocean, river tiles, bridge, waterfall, cliffs, roads, farms, and deterministic environmental dressing |
| Forest composition | Dense fixed eastern band plus lighter north/north-west framing; seeded output keeps the south-west harbor approach open |
| Harbor | Docks, normal delivery ship, rowboat, crates, barrels, cannon, coastal rocks, and a lighthouse composed from Pirate tower pieces |
| Semantic village | Town Hall, Search Tower, Builder Workshop, Validation Forge, Session Lodge, Model Shrine, Approval Gate, Test Camp, Market, Windmill, Watermill, and Backlog Farm |
| Interaction | Orthographic pan/zoom, bounded camera target, Home/reset, building hover, selection ring, semantic panel, and smooth focus animation |
| Presentation | ClanCode HUD, real device-presence polling, disabled future task dock, accessible audio toggle, reduced-motion handling, and adaptive quality |
| Asset boundary | `kenneyGlbUrl()` plus a typed 92-entry catalog; cached GLBs are cloned before pivot/shadow normalization |
| Tooling | Asset existence verifier, model-bounds inspector, GLB URL tests, and deterministic forest tests |
| Font guardrail | Clash Display wired on landing hero via `public/fonts/`; game HUD may still use system fallback where unlicensed redistribution is unresolved |

### Foundation fixes discovered during live browser verification

1. **Terrain obscured most buildings** — oversized `RoundedBox` bevel radii inflated the platform vertically; radii now stay within the mesh height.
2. **Duplicate React scene keys** — village road tuples placed repeated keys and incorrect coordinates; positions and keys are now unique.
3. **Building selection was unreliable** — semantic buildings now use explicit invisible hit volumes; ground interaction clears selection and building interaction stops propagation.
4. **Hover label filled the screen** — Drei `Html distanceFactor={18}` multiplied against the orthographic camera zoom; removing that factor keeps the label compact and anchored over the building.
5. **Scene appeared washed out** — lighting, tone-mapping exposure, fog range, and shadow-map selection were tuned against the live GLBs.

### Foundation validation (2026-08-29)

| Check | Result |
|-------|--------|
| `bun run game:assets:check` | 92 verified GLBs: Fantasy 30, Nature 34, Pirate 14, Survival 14 |
| `bun run test:game` | 4 pass, 0 fail |
| `bun run test:pairing` | 15 pass, 0 fail with Neon/local-port access outside the restricted sandbox |
| `bunx tsc --noEmit` | pass |
| `bun run lint` | pass with 0 errors; 14 pre-existing CLI warnings |
| `bun run build -- --webpack` | pass; `/dashboard`, `/dashboard/clan`, and `/dashboard/devices` included |
| `git diff --check` | pass |
| `git diff -- clan-cli` | empty |
| Signed-in Brave verification | island renders at `http://localhost:3000/dashboard`; selection, focus, HUD, harbor, lighthouse, river, and forest verified |

The restricted runner blocks Turbopack's internal local-port helper. This is an environment limitation; the production-style Webpack build passes. No game dependency or source was added to `clan-cli/`.

---

## clan-cli — Current State

Full harness: supervisor, tools, worktrees, validation, Git/PR, `clancode connect` client, `@clancode/protocol`.

**New in PR #19:**

- `clancode login` / `pair`, credential store, **`resolveRealtimeCredentials()`** (atomic token + deviceId + URL)
- **Auto Socket.IO link** from TUI via `realtime/link.ts`
- **Production gateway** in `app/lib/realtime/gateway.ts` with tests
- **TUI presentation:** `theme.ts`, `clan-art.ts` (island scene), `clan-banner.tsx`, refreshed `header.tsx`
- Tests: header, theme, link, login, credentials, gateway
- `ConnectSession` uses `deviceId` from `resolveRealtimeCredentials()`

Credential lookup order for realtime:

```text
Full env override (token + url + device id together)
      ↓
credentials.json (token + deviceId + controlUrl bundle)
      ↓
"run clancode login"
```

---

## Web App — Current State

- Clerk on `/`, protected game at `/dashboard` (layout-level `auth.protect`), public `/pair`
- `/dashboard/clan` aliases the game and `/dashboard/devices` preserves pairing/revocation controls
- Drizzle tables: `devices`, `pairing_challenges`, `pairing_deliveries`, `clan_layouts`, `clan_run_projections`, `clan_run_session_logs`
- Migrations: `drizzle/0000`–`0004` — apply with `bun run db:migrate`
- Dashboard polls `GET /api/devices` every 5s; green connected dot in `device-panel.tsx`
- Copy clarifies: pair once, run `clancode`, no second login

---

## Conventions (unchanged)

- Filesystem, shell, Git, process execution stay in `clan-cli/`.
- Bun only; separate lockfiles for web vs CLI.
- Structured `RunEvent`; UI animation is never execution authority.
- Never push to default branch or auto-merge from the CLI.

See `AGENTS.md` §9–12 and `ARCHITECTURE.md` §6–11.
