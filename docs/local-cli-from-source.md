# Running the ClanCode CLI from Source

Prefer npm when available:

```bash
npm install -g @clancode/cli@next
clancode --repo /path/to/your/project
```

Use source install when developing ClanCode itself or before a release is on npm.

## Critical rule: target repository

`RunSupervisor` resolves the Git repository from:

1. `--repo PATH` when provided, or
2. **`process.cwd()`** (the directory where you launch the CLI).

If you run the CLI from `clan-cli/` without `--repo`, ClanCode operates on the **CLI workspace**, not your application repository.

For the ClanCode hackathon demo (`demo-obsolete.txt` lives at the **monorepo root**), always pass the repo root:

```bash
cd clan-cli
bun install
bun run dev:clan -- --repo ..
```

The `..` points at the ClanCode repository root from inside `clan-cli/`.

## Development TUI (recommended)

From the ClanCode clone:

```bash
cd clan-cli
bun install
bun run dev:clan -- --repo ..
```

Expected behavior:

- First launch runs `clancode login` pairing if needed.
- TUI auto-connects to the realtime gateway when paired (`control=connected`).
- TrueForge runs locally on loopback (default port `8790`).

## Headless one-shot run

```bash
cd clan-cli
bun run --cwd packages/cli start -- --repo /absolute/path/to/target/repo run "Explain this repository"
```

Build mode (isolated worktree):

```bash
bun run --cwd packages/cli start -- --repo /path/to/repo run --mode build "Fix the failing test"
```

## Local-only harness (no web pairing)

```bash
bun run --cwd packages/cli start -- --offline --repo /path/to/repo
```

## Built binary (without npm publish)

```bash
cd clan-cli/packages/cli
bun install
bun run build
./dist/cli.js --repo /path/to/repo doctor
```

## TrueForge model provider

TrueForge model credentials are configured **inside TrueForge** (loopback UI on port `8790` by default), not in the Next.js `.env.local`.

Optional override:

```bash
export CLAN_TRUEFORGE_MODEL=your-configured-model-name
```

Run `clancode doctor` to verify Node, Git, TrueForge, and repository resolution.
