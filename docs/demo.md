# Hackathon Demo Walkthrough

**Demo video:** [https://youtu.be/istUU5onLCI](https://youtu.be/istUU5onLCI)

This document reproduces the safe two-run approval demo using the tracked file [`demo-obsolete.txt`](../demo-obsolete.txt) at the repository root.

## Before you start

Three terminals running (see [quickstart.md](./quickstart.md)):

1. `bun run dev` → http://localhost:3000
2. `bun run realtime`
3. `cd clan-cli && bun run dev:clan -- --repo ..`

Pair the CLI once. Sign in to the dashboard with the **same** Clerk account.

## What the video shows

- Task submitted from the **Clan Castle** command dock
- TrueForge exploring the repository (Search Tower activity)
- Builders / workshop visualization when code work begins
- **Approval Gate** closing on a risky `delete_file` request
- Human **Deny** then **Approve** on separate runs
- **Validation Forge** running tests/typecheck
- Workshop growth after a successful changed Build
- **Create Pull Request** after explicit human confirmation
- Harbor / PR Courier reacting only after a real `pr.created` event

The village never invents state — it projects sanitized `RunEvent`s from the local CLI.

---

## Run A — Deny (safe)

### Task (Build mode)

```text
Remove demo-obsolete.txt using the normal ClanCode tool flow,
then run validation.
```

### Expected sequence

1. TrueForge reads the repo (`grep`, `read_file`, etc.).
2. Builder visualization activates when mutation work starts.
3. `delete_file` triggers `approval.required`.
4. **Approval Gate closes** in the village; dock shows pending approval.
5. Click **Deny**.
6. `demo-obsolete.txt` **remains on disk**.
7. Projection stays in denied / awaiting-approval state; no delivery.

Do **not** approve the same tool call after denying.

---

## Run B — Approve + validate + PR

Start a **new** task (or restart harness if the UI is stale).

### Task (Build mode)

Same prompt as Run A, or equivalent delete + validate instruction.

### Expected sequence

1. Exploration and builder activity as before.
2. When approval is required, click **Approve**.
3. Local CLI policy allows TrueForge to continue → `approval.granted`.
4. **Approval Gate opens**.
5. File is actually deleted in the isolated worktree.
6. Validation runs (`validation.started` / `validation.completed`).
7. On success with real changes: workshop gains **+1 storey** (cap 4); delivery stage becomes **ready**.
8. Click **Create Pull Request** in the dock (explicit human action).
9. CLI commits, pushes branch, opens GitHub PR.
10. **`pr.created`** event → PR Courier / harbor visualization with real URL.

The PR is **not** auto-merged. A human merges after Qodo and review.

---

## CLI-only equivalent

```bash
cd clan-cli
bun run --cwd packages/cli start -- --repo .. run --mode build "Remove demo-obsolete.txt and run validation"
```

When paused for approval, use interactive mode:

```text
/approve
# or
/deny
```

---

## Restart / session logs

**Restart harness** in the web dock archives activity to Neon session logs and resets the projection. CLI `/cancel` and `/new` archive local TUI transcripts under `$XDG_STATE_HOME/clancode/session-logs/`.

---

## Troubleshooting during demo

See [troubleshooting.md](./troubleshooting.md).

Quick checks:

```bash
clancode doctor          # from built/source CLI with --repo ..
bun run test:pairing     # gateway + pairing tests
```
