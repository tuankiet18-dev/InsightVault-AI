#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f ai-service/.env ]; then
  cp ai-service/.env.example ai-service/.env
  echo "Created ai-service/.env from example. Set GEMINI_API_KEY before using Gemini features."
fi

if [ ! -f infra/.env ]; then
  cp infra/.env.example infra/.env
  echo "Created infra/.env from example."
fi

(cd infra && docker compose --env-file .env up --build)
