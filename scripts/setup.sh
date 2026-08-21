#!/bin/bash
# Bootstrap for a fresh checkout: install dependencies for both apps so every
# documented check (typecheck, lint, unit tests, build) actually runs.
# There is deliberately no root package.json — the two apps are independent.
# Idempotent; safe to re-run.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Installing backend dependencies..."
npm install --prefix "$REPO_ROOT/backend" --no-audit --no-fund

echo "Installing frontend dependencies..."
npm install --prefix "$REPO_ROOT/frontend" --no-audit --no-fund

echo "Done. Checks:"
echo "  backend:  npm run lint / npm test / npx tsc -p tsconfig.json --noEmit  (in backend/)"
echo "  frontend: npm run quality / npm test / npm run build                   (in frontend/)"
