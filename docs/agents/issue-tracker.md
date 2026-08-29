# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues on [ANAMASGARD/ClanCode](https://github.com/ANAMASGARD/ClanCode). Use the `gh` CLI from a clone.

## Conventions

- **Create:** `gh issue create --title "..." --body "..."`
- **Read:** `gh issue view <number> --comments`
- **List:** `gh issue list --state open --label ready-for-agent`
- **Label:** `gh issue edit <number> --add-label "ready-for-agent"`
- **Close:** `gh issue close <number>`

## Blocking edges

Prefer GitHub native issue dependencies when available:

```bash
gh api --method POST repos/ANAMASGARD/ClanCode/issues/<child>/dependencies/blocked_by \
  -F issue_id=<blocker-database-id>
```

Blocker database id: `gh api repos/ANAMASGARD/ClanCode/issues/<n> --jq .id`

Fallback: `Blocked by: #N` at the top of the issue body.

## Pull requests as a triage surface

**PRs as a request surface: no.**
