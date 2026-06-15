#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Missing required command: docker" >&2
  exit 1
fi

check_url() {
  local name="$1"
  local url="$2"
  local attempt

  for attempt in $(seq 1 20); do
    if curl --fail "$url" >/dev/null 2>&1; then
      echo "$name OK"
      return 0
    fi

    if [ "$attempt" -lt 20 ]; then
      echo "$name not ready yet ($attempt/20). Retrying..."
      sleep 3
    fi
  done

  echo "$name failed: $url" >&2
  return 1
}

if [ ! -f infra/.env ]; then
  cp infra/.env.example infra/.env
  echo "Created infra/.env from example. Fill required local values, then rerun checks."
fi

if [ ! -f ai-service/.env ]; then
  cp ai-service/.env.example ai-service/.env
  echo "Created ai-service/.env from example. Fill GEMINI_API_KEY for live AI checks."
fi

docker compose --env-file infra/.env -f infra/docker-compose.yml config --quiet
docker compose --env-file infra/.env -f infra/docker-compose.yml build

docker compose --env-file infra/.env -f infra/docker-compose.yml run --rm --no-deps frontend npm run lint
docker compose --env-file infra/.env -f infra/docker-compose.yml run --rm --no-deps frontend npm run build

docker run --rm \
  -v "$ROOT/backend:/src" \
  -w /src \
  mcr.microsoft.com/dotnet/sdk:10.0 \
  dotnet test InsightVault.slnx

docker compose --env-file infra/.env -f infra/docker-compose.yml run --rm --no-deps ai-service \
  python -c "import fastapi, pydantic, uvicorn, google.generativeai; compile(open('main.py', encoding='utf-8').read(), 'main.py', 'exec'); print('AI service imports OK')"

docker compose --env-file infra/.env -f infra/docker-compose.yml up -d

check_url "Backend liveness" http://localhost:5126/health/live
check_url "Backend readiness" http://localhost:5126/health/ready
check_url "Backend API health" http://localhost:5126/api/health
check_url "AI service health" http://localhost:8000/health

echo "All Docker checks passed."
