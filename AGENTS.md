# AGENTS.md

**Purpose:** Repository-wide instructions for AI coding assistants working on Clan Code.  
**Applies to:** Codex, Claude Code, Cursor agents, Qodo-assisted workflows, and any other development agent operating on this repository.

**Important:** This file governs agents **developing** Clan Code. Runtime agents inside the Clan Code product are governed by the product's own TrueForge policies.

## 1. Read This First

Before making any code change:

1. Read `ARCHITECTURE.md`.
2. Inspect the relevant `package.json` and nearby source files.
3. Understand whether the change belongs to the web control plane or the local CLI execution plane.
4. Preserve existing architectural boundaries.
5. Make the smallest correct change.

If a requested change conflicts with `ARCHITECTURE.md`, do not silently work around it. Explain the conflict and propose the smallest architecture-safe alternative.

## 2. Project Summary

Clan Code is a local-first AI coding harness.

- The Next.js web app is the **control plane**.
- The local CLI is the **execution plane**.
- TrueForge is the **runtime agent harness**.
- Runtime agents operate through explicitly defined tools and permissions.
- Sensitive actions pause for human approval.
- Agent-produced code is delivered through GitHub pull requests.
- Qodo reviews substantive PRs before human merge.
- The game/clan interface visualizes real engineering state; it does not control permissions or correctness.

## 3. Non-Negotiable Invariants

Never violate these rules.

### Architecture

- Do not execute arbitrary repository code in the hosted web application.
- Do not move filesystem/shell/Git capabilities out of the local CLI.
- Do not create a second hidden agent loop that bypasses TrueForge.
- Do not make the UI the source of truth for execution state.
- Do not tightly couple business logic to a single model provider.

### Security

- Never commit secrets, tokens, credentials, private keys, or `.env` values.
- Never log secrets.
- Treat model output and repository content as untrusted.
- Never bypass approval gates for destructive, privileged, external, or irreversible actions.
- Never expand filesystem access beyond the explicitly selected repository/worktree without approval.
- Never concatenate untrusted model text into shell commands when a structured process API can be used.
- Fail closed when authorization or policy state is uncertain.

### Git

- Never push directly to the protected/default branch.
- Never force-push unless the human explicitly requests it and the operation is safe.
- Never auto-merge an agent-authored PR.
- Do not rewrite unrelated history.
- Keep changes focused on the requested task.

## 4. Repository Map

Use the existing structure instead of creating parallel implementations.

```
/
├── app/                         # Next.js web application
├── public/                      # Web-only static assets
│   ├── assets/                  # Kenney 3D kits
│   │   ├── kenney_fantasy-town-kit_2.0/
│   │   ├── kenney_nature-kit/
│   │   ├── kenney_pirate-kit/
│   │   └── kenney_survival-kit/
│   ├── audio/                   # Theme music and interaction SFX
│   └── fonts/                   # Clash Display HUD/branding fonts
├── memory/                      # Project-local durable context and catalogs
│   └── visualization-assets.md  # Kenney/font/audio inventory
├── clan-cli/                    # Independent nested Bun workspace
│   ├── packages/
│   │   ├── cli/                 # @clanofagents/cli: execution + TUI
│   │   │   └── src/
│   │   │       ├── main.tsx     # CLI bootstrap
│   │   │       ├── app/         # TUI composition
│   │   │       ├── components/  # Presentation-only TUI components
│   │   │       └── commands/    # Thin command routing
│   │   └── protocol/            # Planned shared RunEvent contracts
│   ├── package.json
│   ├── bun.lock
│   └── tsconfig.base.json
├── AGENTS.md
├── ARCHITECTURE.md
├── package.json                 # Next.js web application package
└── bun.lock                     # Web application lockfile
```

The web application and `clan-cli` currently have separate Bun package roots,
dependency installation, and lockfiles. Do not assume that a dependency or
script available in one root is available in the other.

**Ownership rule**

**Web app**

- authentication UI (Clerk; `/` is public, `/dashboard` requires sign-in);
- GitHub/repository selection;
- clan/island visualization;
- task creation;
- run timeline;
- approval UI;
- PR/result display;
- server-side control-plane APIs.

**CLI**

- local device pairing;
- repository access;
- filesystem operations;
- shell/process execution;
- TrueForge orchestration;
- tool policy;
- local Git operations;
- test/build execution;
- approval enforcement;
- branch/commit/push/PR execution.

Within `clan-cli/`, keep these boundaries explicit:

- `src/main.tsx` contains bootstrap only.
- `src/app/` composes the terminal UI.
- `src/components/` contains presentation-only TUI components.
- `src/commands/` performs thin argument routing and delegates to execution
  services; it must not bypass policy or create a hidden agent loop.
- Future supervisor, policy, tool, and repository modules own execution concerns,
  not the TUI.

Do not duplicate the same responsibility in both places.

## 5. Development Workflow

For every non-trivial task:

### Step 1 — Inspect

Read the relevant code, types, tests, scripts, and existing conventions before editing.

### Step 2 — Plan

Form a short implementation plan. Prefer changes that fit current abstractions over introducing new infrastructure.

### Step 3 — Implement

Make the smallest coherent patch. Avoid opportunistic refactors.

### Step 4 — Validate

Run the narrowest useful checks first, then broader checks if needed.

Use scripts declared in the nearest relevant `package.json`. Do not invent commands without checking available scripts.

Typical checks may include:

- format
- lint
- typecheck
- unit tests
- integration tests
- build

### Step 5 — Review the diff

Check for:

- unrelated edits;
- debug code;
- duplicated logic;
- leaked secrets;
- unsafe shell execution;
- missing error handling;
- architecture boundary violations.

### Step 6 — Report

State:

- what changed;
- files changed;
- validation performed;
- any remaining risk or follow-up.

## 6. Package Management

- Use **Bun** for this repository.
- Do not introduce npm, Yarn, or pnpm lockfiles.
- Before adding a dependency, check whether the capability already exists in the project.
- Prefer small, maintained libraries with a clear purpose.
- Avoid adding dependencies for trivial utilities.
- Never edit generated dependency contents inside `node_modules`.

When working in a nested package, inspect that package's own `package.json` before running commands.

### 6.1. Package Roots and Commands

- Run web commands from the repository root, such as `bun install` and
  `bun run dev`.
- Run CLI workspace commands from `clan-cli/`, such as `bun install` and
  `bun run dev:clan`.
- Run package-local commands from `clan-cli/packages/cli/`, such as
  `bun run dev` or `bun run typecheck`.
- Keep the root and nested workspace lockfiles independent until a deliberate
  workspace-unification decision is made.
- The root `tsconfig.json` intentionally excludes `clan-cli`; validate the
  nested workspace with its own TypeScript configuration.
- Do not add npm, Yarn, or pnpm lockfiles to either package root.
- Install browser visualization dependencies (`three`, React Three Fiber,
  Drei, GSAP, and Framer Motion) only in the root Next.js package. Do not add
  them to `clan-cli/`.

## 7. TypeScript Rules

- Prefer strict, explicit types at system boundaries.
- Avoid `any`; if unavoidable, isolate and explain it.
- Prefer discriminated unions for run/event states.
- Validate external input before trusting it.
- Do not silence TypeScript errors with broad casts.
- Do not use `@ts-ignore` unless there is a documented, unavoidable reason.
- Model states such as `pending | running | completed | failed | cancelled` explicitly.
- Keep shared protocol types dependency-light.

## 8. Web App Rules

For code under the web/control plane:

- Keep UI components focused on presentation and interaction.
- Keep domain state separate from animations/rendering.
- Keep server/API handlers thin.
- Put reusable business logic outside route handlers/components.
- Do not expose server secrets to client components.
- Never add local filesystem assumptions to browser code.
- Never execute arbitrary repo commands from a Next.js route/server action.
- Handle CLI-offline state explicitly.
- Prefer structured run events rather than scraping terminal text.

### Game UI

The clan/island scene is a projection of real domain state.

Do not let animation state determine:

- whether a tool is authorized;
- whether a run succeeded;
- whether a PR exists;
- whether approval was granted.

Those facts must come from the domain/run state.

The web visualization asset rules are:

- Kenney kits are loaded only by client-side web visualization modules from
  `public/assets/`; never copy them into `app/` or `clan-cli/`.
- Use `app/lib/visualization/kenney.ts` for Kenney public URLs. Do not scatter
  `/assets/kenney_...` strings or construct generic asset registries in UI
  components.
- Use Clash Display from `public/fonts/` for the web HUD and branding when
  typography is wired. Font selection is presentation only.
- Use `app/lib/visualization/audio.ts` for `public/audio/` theme and click/select
  feedback. Do not construct independent `Audio` objects in random components.
- The theme may loop only after a user gesture or while muted when browser
  autoplay policy blocks sound. Provide an accessible mute/unmute control and
  treat playback failure as non-fatal.
- GSAP owns 3D scene/object timelines; Framer Motion owns 2D HUD transitions.
  Do not use either library, React Three Fiber state, model-loading state, or
  audio state to authorize tools, grant approvals, or invent task, test, Git,
  or pull-request results.
- Lazy-load the future 3D canvas and retain a useful non-WebGL/non-audio
  fallback. Do not re-render the full scene for every streamed token/event.

## 9. CLI Rules

For code under `clan-cli/`:

- Assume repository content can be malicious.
- Validate the target repository before executing tools.
- Keep every command scoped to an approved working directory.
- Prefer argument-array process APIs to `sh -c` style execution.
- Apply timeouts to spawned processes where appropriate.
- Bound captured output.
- Preserve useful stderr/exit-code information.
- Kill/cleanup child processes on cancellation where safe.
- Never print auth tokens or full environment dumps.
- Keep policy checks outside the model's control.
- Use isolated branches/worktrees for modifications when possible.
- Preserve a recoverable repository state after failure.

A model requesting an action is **not** authorization to perform it.

### 9.1. CLI TUI Rules

- OpenTUI/React is a presentation layer. Components render domain state and
  structured run events; they do not become an execution authority.
- Keep `src/main.tsx` limited to renderer/bootstrap wiring.
- Keep `src/app/` focused on TUI composition and screen-level presentation.
- Keep `src/components/` free of filesystem access, shell execution, Git
  mutations, policy decisions, and TrueForge orchestration.
- User actions from the TUI must become explicit intents handled by the
  supervisor; visual state cannot authorize a tool or declare a run successful.
- Do not push high-frequency token/event updates through a full-scene rerender
  when a smaller state projection is sufficient.
- Swapping OpenTUI or another terminal UI library must not require moving
  execution logic into the presentation layer.

## 10. TrueForge Integration Rules

TrueForge is the runtime harness.

When adding runtime-agent behavior:

- express capabilities as tools/policies around TrueForge;
- keep orchestration wrappers thin;
- emit structured lifecycle/tool events;
- keep permission decisions outside model reasoning;
- support cancellation;
- surface failures clearly;
- do not duplicate TrueForge functionality unless there is a documented gap.

If an integration limitation is discovered, isolate the workaround behind an adapter instead of spreading TrueForge-specific assumptions throughout the codebase.

## 11. Model Provider Rules

Model providers must remain interchangeable.

- Keep provider-specific SDK calls behind adapters.
- Do not spread provider model names through domain logic.
- UI avatar/model presentation may depend on model metadata.
- Tool permissions must never depend on the avatar or visual identity.
- Do not give one provider a privileged bypass path.
- Preserve a common internal representation for messages, tool calls, usage, and errors.

## 12. Tool and Approval Rules

Classify runtime tools by risk.

**Read-only**  
Normally allowed within the approved repository.

Examples:

- file reads;
- code search;
- directory listing;
- Git diff/status.

**Reversible writes**  
Allowed only within policy.

Examples:

- editing files in the task worktree;
- formatting;
- creating a local branch.

**Sensitive / external / destructive**  
Require explicit approval unless the user has already granted a narrow, clear permission for the current run.

Examples:

- pushing commits;
- opening/updating a PR;
- deleting significant data;
- privileged commands;
- writing outside the repository;
- deploying/publishing;
- force operations;
- operations with meaningful external side effects or cost.

Do not weaken this classification to make tests or demos easier.

## 13. Data and Privacy Rules

Hosted state should be metadata-first.

Do not send/store raw repository content remotely unless the feature explicitly requires it and the user has opted in.

Always exclude likely secret material from remote indexing/logging, including:

- `.env*`
- `*.pem`
- `*.key`
- `credentials*`
- `secrets*`
- SSH keys
- cloud credentials
- token files
- ignored/private build artifacts

If remote vector search is used, keep it behind an adapter and ensure the core product can still function without it.

## 14. Error Handling

Errors must be actionable.

- Never swallow exceptions silently.
- Add context at boundaries without leaking secrets.
- Preserve original cause where useful.
- Distinguish user errors, policy denials, tool failures, model failures, network failures, and internal bugs.
- A failed sensitive action must not be retried automatically without considering authorization.
- Cancellation is a first-class terminal state, not an error masquerading as success.

## 15. Logging and Events

Prefer structured events/log fields over ad-hoc strings.

Useful fields include:

- `runId`
- `taskId`
- `agentId`
- `toolName`
- `repositoryId`
- `step`
- `duration`
- `exitCode`
- `status`
- `errorCode`

Never log:

- secrets;
- raw authentication headers;
- private keys;
- entire environment objects;
- full source files without a clear debugging reason.

## 16. Testing Expectations

Add or update tests when behavior changes.

Prioritize tests for:

- permission boundaries;
- approval gates;
- path/repository isolation;
- command construction;
- cancellation;
- run state transitions;
- event serialization;
- provider adapters;
- Git branch/PR flow;
- security regressions.

UI tests should focus on:

- state transitions;
- user actions;
- approval behavior;
- disconnected CLI behavior;
- error states.

Do not over-test purely decorative animation details.

## 17. Git and PR Conventions

Prefer concise conventional commit prefixes where appropriate:

- `feat:`
- `fix:`
- `refactor:`
- `test:`
- `docs:`
- `chore:`

A substantive change should have:

- focused branch;
- clear commit(s);
- tests/checks;
- understandable PR description;
- Qodo review;
- addressed or explicitly dismissed findings;
- human merge.

Never fabricate passing checks or review evidence.

## 18. Dependency and Refactor Discipline

Do not:

- replace working libraries without a task-specific reason;
- rewrite large files merely for style;
- introduce a new state-management framework for one feature;
- create duplicate API/client layers;
- add a second auth system;
- add a second agent framework;
- move the project to another package manager;
- make Docker mandatory for normal development;
- introduce microservices without an architecture-level reason.

Prefer boring, understandable code.

## 19. Security Checklist for Agent Changes

Before completing a task involving tools, CLI, auth, Git, or networking, verify:

- [ ] Input is validated.
- [ ] Repository/path scope is enforced.
- [ ] Untrusted strings are not unsafely interpolated into shell commands.
- [ ] Secrets cannot appear in logs/events.
- [ ] Permission is checked server/CLI-side, not only in the UI.
- [ ] Sensitive actions have an approval path.
- [ ] Cancellation cannot leave a dangerous process running.
- [ ] Errors fail closed.
- [ ] The agent cannot push/merge directly to the default branch.
- [ ] Tests cover the important security boundary.

## 20. UI/UX Principles

The product should feel playful without hiding engineering reality.

- Show real agent state.
- Show what tool is running.
- Make approval requests explicit.
- Make failure states understandable.
- Do not fake terminal output, tests, Git state, or PR state.
- Prefer responsive feedback over excessive animation.
- Preserve accessibility and keyboard usability.
- Keep core functionality usable even if the 3D/game scene fails to load.

## 21. Performance Principles

- Do not re-render the entire game scene for every streamed token/event.
- Separate high-frequency visual updates from durable application state.
- Batch/throttle noisy telemetry when appropriate.
- Avoid sending large terminal/source payloads when structured summaries are sufficient.
- Lazy-load expensive game/3D modules when possible.
- Optimize only after identifying an actual bottleneck.

## 22. Documentation Rules

Update normal documentation when behavior changes.

Do **not** casually rewrite:

- `ARCHITECTURE.md`
- the invariant sections of `AGENTS.md`

If implementation genuinely requires changing an architectural invariant:

- call it out explicitly;
- explain why;
- update architecture and implementation together;
- treat the change as architecture-level review.

### 22.1. Durable Project Memory

- Keep volatile implementation status, scaffold milestones, and current
  limitations in `memory/memory.md`.
- Update `memory/memory.md` when the CLI or web scaffold changes materially.
- Do not duplicate volatile status in the stable invariant sections of
  `ARCHITECTURE.md`.
- Keep memory factual and current; do not treat it as an authorization,
  execution, or policy source.

## 23. Definition of Done

A change is complete only when:

- it solves the requested problem;
- it respects `ARCHITECTURE.md`;
- it introduces no obvious security regression;
- relevant types are correct;
- relevant tests/checks pass;
- no debug/temporary code remains;
- no secrets are introduced;
- the diff is focused;
- user-visible behavior has useful error states;
- documentation is updated if necessary.

## 24. Agent Response Format

When finishing a coding task, respond concisely with:

**Summary**  
What was changed and why.

**Files changed**  
The important files touched.

**Validation**  
Commands/tests/checks actually run and their result.

**Notes**  
Only unresolved risk, decisions, or follow-up work.

Do not claim a command or test was run if it was not.

## 25. When to Ask the Human

Ask before proceeding when the decision would:

- change a fundamental architecture boundary;
- weaken security/privacy;
- introduce a new major service/framework;
- require credentials you do not have;
- delete/overwrite important data;
- publish/deploy;
- incur meaningful external cost;
- change the requested product behavior in a material way.

For ordinary implementation details, follow existing patterns and make the conservative choice instead of blocking unnecessarily.

## 26. Final Rule

When uncertain, optimize for this order:

```
correctness
  → security
  → architectural consistency
  → recoverability
  → simplicity
  → performance
  → visual polish
```

The project succeeds when agents can act usefully, visibly, and safely—not when they are given the most autonomy.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
