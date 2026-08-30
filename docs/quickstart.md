# ClanCode Quickstart

## Install CLI (fastest path)

```bash
npm install -g @clancode/cli@next   # beta; requires Bun >= 1.4, Node >= 22.14, Git
clancode doctor
clancode login
```

Run `clancode` from the Git repository you want the agent to edit.

## Full stack (web + gateway + CLI)

```bash
git clone https://github.com/ANAMASGARD/ClanCode.git && cd ClanCode
bun install && cd clan-cli && bun install && cd ..
cp .env.example .env.local
# Fill: Clerk keys, DATABASE_URL, PAIRING_DELIVERY_KEY, CLANCODE_REALTIME_RELAY_SECRET
bun run db:migrate
```

| Terminal | Command |
|----------|---------|
| 1 | `bun run dev` → http://localhost:3000 |
| 2 | `bun run realtime` |
| 3 | `clancode` from target repo, or `cd clan-cli && bun run dev:clan -- --repo ..` |

Pair once → `/dashboard` → Clan Castle → submit task.

Demo script: [demo.md](./demo.md) · Troubleshooting: [troubleshooting.md](./troubleshooting.md)
