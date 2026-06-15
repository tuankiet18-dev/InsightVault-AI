#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

rm -rf \
  frontend/dist \
  frontend/.vite \
  backend/InsightVault.API/bin \
  backend/InsightVault.API/obj \
  backend/InsightVault.API.Tests/bin \
  backend/InsightVault.API.Tests/obj \
  ai-service/__pycache__ \
  ai-service/.pytest_cache \
  ai-service/notebooks/.ipynb_checkpoints \
  .pytest_cache \
  test-artifacts

echo "Clean complete."
