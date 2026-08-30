# ClanCode

Local-first AI coding harness. The Next.js web app is the **control plane**. The `clancode` CLI is the **execution plane**. [TrueForge](https://trueforge.dev) is the **runtime agent harness** that actually runs tools, worktrees, approvals, and validation. The clan island visualizes real `RunEvent`s — it does not authorize tools, grant approvals, or invent Git/PR results.

## Setup

Copy [`.env.example`](.env.example) to `.env.local` and fill Clerk, Neon `DATABASE_URL`, `PAIRING_DELIVERY_KEY`, and:

```bash
CLANCODE_REALTIME_INTERNAL_URL=http://127.0.0.1:3001
CLANCODE_REALTIME_RELAY_SECRET=<long random string>
```

Apply migrations (including `clan_run_projections`) with `bun run db:migrate`. Install both package roots:

```bash
bun install
cd clan-cli && bun install
```

## Run (three terminals)

```bash
# Terminal 1 — web control plane
bun run dev

# Terminal 2 — realtime gateway (loopback only)
bun run realtime

# Terminal 3 — CLI inside a safe Git repo (this one is fine for the demo file)
cd clan-cli && bun run dev:clan
```

Pair the laptop once in the browser (`clancode login` or `cd clan-cli && bun run login`). After that, the CLI auto-connects. If the website shows **Laptop offline** or **No devices**, you likely approved pairing under a different Clerk account — run **`bun run login`** again while signed in as the account you use on the site.

Optional voice: set server-only `OPENAI_API_KEY` in `.env.local` to enable push-to-talk in the Castle chat (transcripts append to the textarea; they never auto-send).

## Architecture / TrueForge

Browser Clerk HTTP → Next.js `/api/clan/*` → secret `POST http://127.0.0.1:3001/internal/command` → one Socket.IO socket → paired CLI → TrueForge `RunSupervisor` → sanitized `run.event` → Neon `clan_run_projections` (gateway is the only writer) → poll `GET /api/clan/run` → island + HUD.

TrueForge owns tool execution, sandbox/worktree, approval pauses, and validation. The game projects that state: Search Tower for reads, builders + workshop floors for real diffs after validation, Approval Gate for `approval.required` / `granted` / `denied`, PR Courier only after a human **Create Pull Request** and a real `pr.created` event.

## Two-run demo

Tracked disposable file: [`demo-obsolete.txt`](demo-obsolete.txt).

1. **Run A (deny):** Dispatch a Build task that would delete or rewrite `demo-obsolete.txt`. When the Approval Gate closes, **Deny**. The file remains. The snapshot stays `awaiting_approval` + denied. Do not approve that same tool call.
2. **Run B (approve + PR):** Start a **new** task. Approve when asked. Cancel still works instead of approve if you click it. After validation passes, the workshop gains one floor (cap 4) and the dock shows **Ready for delivery**. Confirm **Create Pull Request** — that commits the worktree, pushes the task branch, and opens a GitHub PR. The courier ship sails only when `pr.created` arrives with a real URL.

Failed validation, cancel, and Plan mode never grow the workshop and never enable delivery.

## Demo video

Placeholder until recorded: _add the public video URL here_.

## AI coding assistant disclosure

This repository was implemented with AI coding assistants (Cursor / Claude) under human direction. Architecture invariants in `ARCHITECTURE.md` and `AGENTS.md` were treated as non-negotiable. Humans own pairing, approvals, pull-request merge, and production secrets.

## Qodo Code Review Evidence

Representative merged review: [PR #19 — Clerk device pairing](https://github.com/ANAMASGARD/ClanCode/pull/19).

Qodo surfaced mixing of token/device/URL credentials, untested gateway auth/presence paths, raw API error leakage, pairing approval/expiry races, and `slow_down` ignored during device login. Those were fixed in [`f6eba20`](https://github.com/ANAMASGARD/ClanCode/commit/f6eba20) (`resolveRealtimeCredentials`, `runDetached` gateway handlers, request-id `internal_error` responses, expiry predicates on approve/deny, exponential backoff). Follow-up review against the merged pairing slice is recorded in `memory/memory.md`. This run-visualization change is intended to go through the same `/agentic_review` gate before human merge.

## License

Private / unpublished unless otherwise noted. Kenney 3D kits remain under their own licenses in `public/assets/`.
