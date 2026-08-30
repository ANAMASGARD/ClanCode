#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
ENV_FILE="$ROOT/.env.local"
PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — set NPM_TOKEN there for publish." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${NPM_TOKEN:-}" ]]; then
  echo "NPM_TOKEN is empty in $ENV_FILE" >&2
  exit 1
fi

NPMRC="$(mktemp)"
trap 'rm -f "$NPMRC"' EXIT
printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$NPMRC"

cd "$PKG_DIR"
bun run build
npm publish --access public --tag next --userconfig "$NPMRC"
