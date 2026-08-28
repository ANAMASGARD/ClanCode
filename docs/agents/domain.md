# Domain docs

Single-context repo. Stable contracts: `ARCHITECTURE.md`, `AGENTS.md`. Volatile status: `memory/memory.md`.

## Before exploring

1. Read `ARCHITECTURE.md` for control plane vs execution plane boundaries.
2. Read `AGENTS.md` for agent development invariants.
3. Read `memory/memory.md` for current scaffold status.
4. Check `docs/adr/` when it exists for decisions in the area you touch.

If `CONTEXT.md` does not exist, proceed silently — use vocabulary from `ARCHITECTURE.md` (Run, Task, Repository, Approval, RunEvent, etc.).

## Vocabulary

Use domain terms from `ARCHITECTURE.md` in issue titles, tests, and specs. Do not invent parallel names for Run, Task, Supervisor, TrueForge, or RunEvent types.
