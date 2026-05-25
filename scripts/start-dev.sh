#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -x ai-service/venv/bin/python ]; then
  echo "Missing ai-service venv. Run ./scripts/setup.sh first." >&2
  exit 1
fi

if [ ! -d frontend/node_modules ]; then
  echo "Missing frontend node_modules. Run ./scripts/setup.sh first." >&2
  exit 1
fi

(cd infra && docker compose -f docker-compose.dev.yml up -d)

(cd backend/InsightVault.API && dotnet run --launch-profile http) &
(cd ai-service && ./venv/bin/python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000) &
(cd frontend && npm run dev -- --host 127.0.0.1) &

echo "Local services are starting:"
echo "- Frontend: http://localhost:5173"
echo "- Backend:  http://localhost:5126/api/health"
echo "- AI:       http://localhost:8000/health"
wait
