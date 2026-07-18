#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

required=(
  PROMPT_MESTRE.md
  AI_CONTINUITY_PROTOCOL.md
  CURRENT_HANDOFF.md
  HISTORY.md
  IMPLEMENTATION_STATUS.md
  continuity/DECISION_LOG.md
  continuity/COMMAND_LOG.md
  continuity/KNOWN_ISSUES.md
  prompts/PROMPT_RETOMAR_QUALQUER_LLM.md
  scripts/capture-handoff.sh
)

missing=0
for f in "${required[@]}"; do
  if [ ! -f "$f" ]; then
    echo "MISSING: $f"
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  exit 1
fi

echo "Continuity files present."
latest=$(find continuity/snapshots -maxdepth 1 -type f -name '*.md' -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2- || true)
if [ -n "$latest" ]; then
  echo "Latest snapshot: $latest"
else
  echo "No snapshot found yet. Run: bash scripts/capture-handoff.sh start"
fi
