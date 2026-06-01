#!/usr/bin/env bash
# Playwright MCP wrapper — optional auth.json for /protected/* URLs
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUTH="$ROOT/.playwright/auth.json"

ARGS=(
  --browser chrome
  --caps vision
  --viewport-size 430x860
  --allow-unrestricted-file-access
)

if [[ -f "$AUTH" ]]; then
  ARGS+=(--storage-state "$AUTH")
fi

exec /opt/homebrew/bin/playwright-mcp "${ARGS[@]}"
