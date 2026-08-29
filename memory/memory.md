# ClanCode — Project Memory

**Last updated:** 2026-08-29 (PR #19 Qodo review fixes)

## What This Repo Is

ClanCode is a local-first AI coding harness:

- **Web app (`app/`)** — Next.js control plane: Clerk auth, device pairing, dashboard device presence, Neon/Drizzle persistence. **Socket.IO task composer not wired yet.**
- **CLI (`clan-cli/`)** — Complete local execution plane (`@clancode/cli`). Users run `clancode`, not TrueForge directly.
- **TrueForge** — Runtime agent harness via `RunSupervisor`.
- **Delivery** — Agent changes go through isolated branches → PR → Qodo review → human merge.

Stable contracts: `ARCHITECTURE.md`, `AGENTS.md`. Volatile status lives here.

## Architecture Boundary (short)

> The web app expresses intent and visualizes state; the paired local CLI executes inside an approved repository; TrueForge runs the agents; policy gates their tools; risky actions require a human; and code reaches the default branch only through a reviewed pull request.

Do not move filesystem/shell/Git execution into the Next.js app.

---

## Milestone: CLI harness complete (PR #18)

**Merged:** `4b0b921` on `main`. Package `@clancode/cli@0.1.0-beta.1`, binary `clancode`.

Local AI harness is feature-complete for hackathon scope. **Stop adding general coding-agent features to the CLI** unless architecture explicitly requires it.

---

## Active milestone: Web control-plane pairing (PR #19)

**Branch:** `feat/clerk-device-pairing` — Clerk + device pairing + live CLI presence + TUI polish.

### What works now

| Flow | Status |
|------|--------|
| Clerk user auth (linked app `app_3IXcn0Ap17Yw14c5AcYZYb5mws8`) | ✅ |
| Landing Sign in / Sign up / UserButton | ✅ |
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

### Qodo review fixes (PR #19, pending re-review)

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

**Merge gate (not yet complete):** Qodo re-review → 0 unresolved threads; manual E2E checklist on PR #19; then merge.

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

### Not built yet (next: PR #20)

1. **Task composer → `task.start` → RunEvents in browser → approval UI → PR result**
2. Neon domain tables (repositories, tasks, runs, run_events, approvals)
3. 3D clan/island game visualization (asset collection can proceed in parallel)
4. npm registry publish

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

- Clerk on `/`, protected `/dashboard` (layout-level `auth.protect`), public `/pair`
- Drizzle tables: `devices`, `pairing_challenges`, `pairing_deliveries`
- Migration: `drizzle/0000_smooth_sasquatch.sql`
- Dashboard polls `GET /api/devices` every 5s; green connected dot in `device-panel.tsx`
- Copy clarifies: pair once, run `clancode`, no second login

---

## Conventions (unchanged)

- Filesystem, shell, Git, process execution stay in `clan-cli/`.
- Bun only; separate lockfiles for web vs CLI.
- Structured `RunEvent`; UI animation is never execution authority.
- Never push to default branch or auto-merge from the CLI.

See `AGENTS.md` §9–12 and `ARCHITECTURE.md` §6–11.
