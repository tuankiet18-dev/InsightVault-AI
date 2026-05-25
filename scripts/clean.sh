#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

rm -rf \
  frontend/dist \
  backend/InsightVault.API/bin \
  backend/InsightVault.API/obj \
  ai-service/__pycache__ \
  ai-service/notebooks/.ipynb_checkpoints

echo "Clean complete."
