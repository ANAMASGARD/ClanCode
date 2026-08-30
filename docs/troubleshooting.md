# ClanCode Troubleshooting

Symptoms and fixes verified against the current codebase. For setup from scratch, see [quickstart.md](./quickstart.md).

## Dashboard shows **Laptop offline**

| Check | Action |
|-------|--------|
| Gateway not running | Terminal 2: `bun run realtime` from repo root |
| Wrong Clerk account | Pair and sign in with the **same** Clerk user |
| Stale / revoked pairing | `cd clan-cli && bun run login` |
| Missing `DATABASE_URL` | Set in `.env.local`; run `bun run db:migrate` |
| Relay secret mismatch | `CLANCODE_REALTIME_RELAY_SECRET` must match in `.env.local` |
| Heartbeat TTL expired | Restart CLI; presence TTL is ~45s |

CLI header should show `control=connected` when the Socket.IO link is healthy.

## Web shows connected but commands fail

| Check | Action |
|-------|--------|
| Relay unreachable | `CLANCODE_REALTIME_INTERNAL_URL=http://127.0.0.1:3001` |
| Missing relay secret | Set `CLANCODE_REALTIME_RELAY_SECRET` |
| Command timeout | TrueForge cold start ~30s; default ACK timeout 45s (`CLANCODE_COMMAND_ACK_TIMEOUT_MS`) |
| CLI busy | Finish or cancel the current run before dispatching another task |

## TrueForge / model errors

| Symptom | Action |
|---------|--------|
| `No TrueForge model is configured` | Open TrueForge UI (`http://localhost:8790`), add a model provider, or set `CLAN_TRUEFORGE_MODEL` |
| Node too old | TrueForge requires Node **≥ 22.14** — run `node --version` |
| Port conflict on 8790 | Set `TRUEFORGE_PORT` / `TRUEFORGE_BASE_URL` (loopback only) |
| First run slow | Wait for TrueForge spawn; increase `TRUEFORGE_START_TIMEOUT_MS` if needed |

Run diagnostics:

```bash
cd clan-cli
bun run --cwd packages/cli start doctor -- --repo ..
```

## Database errors

| Symptom | Action |
|---------|--------|
| Missing tables | `bun run db:migrate` from repo root |
| Connection refused | Verify `DATABASE_URL` (Neon pooled URL, `sslmode=require`) |
| Migration failures | Neon HTTP driver: one SQL statement per migration file (see `drizzle/`) |

```bash
bun run db:check
```

## Pairing problems

1. Run `cd clan-cli && bun run login`.
2. Ensure browser is signed into Clerk before approving `/pair`.
3. If delivery expired, start login again (challenges expire).
4. Revoked devices: approve a fresh pairing from `/dashboard/devices`.

## Port conflicts

| Port | Service |
|------|---------|
| 3000 | Next.js web |
| 3001 | Realtime gateway |
| 8790 | TrueForge (default) |

## CLI operates on the wrong repository

**Symptom:** Agent edits files in `clan-cli/` instead of your project.

**Cause:** CLI defaults to `process.cwd()`.

**Fix:** Always pass `--repo`:

```bash
cd clan-cli
bun run dev:clan -- --repo /absolute/path/to/your/project
```

For this repository's demo file: `--repo ..` from `clan-cli/`.

See [local-cli-from-source.md](./local-cli-from-source.md).

## Voice / microphone unavailable

- Requires server-only `OPENAI_API_KEY` in `.env.local` (never `NEXT_PUBLIC_*`).
- Mic permission must be granted in the browser.
- Voice is optional; text tasks work without it.

## WebGL / 3D scene fails

The dashboard remains usable via HUD panels and command dock even if the Three.js canvas fails. Check browser WebGL support and try disabling heavy GPU extensions.

## Run stuck in **planning**

Use **Restart harness** in the Castle command dock (archives activity, cancels remote run when possible, resets projection). Ensure gateway + CLI are online.

## Validation commands

```bash
# Web
bun run test:pairing
bun run test:game
bun run test:clan-layout

# CLI
cd clan-cli && bun test
```

One CLI test (`resumeStoredSession repository boundary`) may flake when run in the full suite but passes in isolation.
