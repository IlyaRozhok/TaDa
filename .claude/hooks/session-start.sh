#!/bin/bash
# SessionStart hook for Claude Code on the web: a fresh container has no
# node_modules in either app, so every documented check (lint, tests, build)
# fails until dependencies are installed. Local sessions skip this — their
# checkout is already set up.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

bash "$CLAUDE_PROJECT_DIR/scripts/setup.sh"
