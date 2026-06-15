#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Missing required command: docker" >&2
  exit 1
fi

if [ ! -f ai-service/.env ]; then
  cp ai-service/.env.example ai-service/.env
  echo "Created ai-service/.env from example. Set GEMINI_API_KEY before using AI features."
fi

if [ ! -f infra/.env ]; then
  cp infra/.env.example infra/.env
  echo "Created infra/.env from example."
fi

docker compose --env-file infra/.env -f infra/docker-compose.yml config --quiet
docker compose --env-file infra/.env -f infra/docker-compose.yml build

echo
echo "Docker setup complete."
echo "Next: update infra/.env and ai-service/.env, then run ./scripts/start-docker.sh"
