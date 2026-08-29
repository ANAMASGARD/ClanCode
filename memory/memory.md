# ClanCode — Project Memory

**Last updated:** 2026-08-29 (control-plane device pairing + live connect slice)

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

## Active milestone: Web control-plane pairing (this PR)

### What works now

| Flow | Status |
|------|--------|
| Clerk user auth (linked app `app_3IXcn0Ap17Yw14c5AcYZYb5mws8`) | ✅ |
| Landing Sign in / Sign up / UserButton | ✅ |
| `clancode login` / `clancode pair` | ✅ |
| Browser `/pair?code=XXXX` approve / deny | ✅ |
| One-time AES-GCM device token delivery | ✅ |
| `clancode connect` → local Socket.IO `:3001` | ✅ |
| `device.hello` / `device.heartbeat` via `"event"` envelope | ✅ |
| Dashboard device list + online TTL (45s on `lastSeenAt`) | ✅ |
| Revoke device (fail-closed on connect/heartbeat) | ✅ |

### Pairing model

- **Clerk** authenticates the human in the browser only.
- **ClanCode device token** is opaque, revocable, stored locally in `$XDG_STATE_HOME/clancode/credentials.json` (`0600`).
- Neon stores **SHA-256(token)** only; raw token is encrypted in `pairing_deliveries` until one-time poll consume.
- Device lifecycle: `pending` (after browser approve) → `active` (after CLI poll) → `revoked`.
- Challenge lifecycle: `pending` → `approved`/`denied`/`expired`/`consumed`.

### Dev commands

```bash
# Web (port 3000)
bun run dev

# Realtime gateway (port 3001)
bun run realtime

# CLI pairing + connect
cd clan-cli && bun run --cwd packages/cli start login
CLANCODE_WEB_URL=http://localhost:3000 \
CLANCODE_CONTROL_URL=http://localhost:3001 \
  bun run --cwd packages/cli start connect
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

### Not built yet (next PRs)

1. **Task composer → `task.start` → RunEvents in browser → approval UI**
2. Neon domain tables (repositories, tasks, runs, run_events, approvals)
3. 3D clan/island game visualization
4. npm registry publish

---

## clan-cli — Current State

Full harness: supervisor, tools, worktrees, validation, Git/PR, `clancode connect` client, `@clancode/protocol`.

**New:** `clancode login` / `pair`, credential store, composite credentials provider for connect.

Credential lookup order for `clancode connect`:

```text
CLANCODE_DEVICE_TOKEN
      ↓
credentials.json
      ↓
"run clancode login"
```

---

## Web App — Current State

- Clerk on `/`, protected `/dashboard`, public `/pair`
- Drizzle tables: `devices`, `pairing_challenges`, `pairing_deliveries`
- Migration: `drizzle/0000_smooth_sasquatch.sql`
- Dashboard polls `GET /api/devices` every 5s (no browser Socket.IO yet)

---

## Conventions (unchanged)

- Filesystem, shell, Git, process execution stay in `clan-cli/`.
- Bun only; separate lockfiles for web vs CLI.
- Structured `RunEvent`; UI animation is never execution authority.
- Never push to default branch or auto-merge from the CLI.

See `AGENTS.md` §9–12 and `ARCHITECTURE.md` §6–11.
