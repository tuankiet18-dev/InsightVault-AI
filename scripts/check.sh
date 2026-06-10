#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

(cd frontend && npm run lint && npm run build)
dotnet build backend/InsightVault.slnx
dotnet test backend/InsightVault.slnx --no-build

if [[ -x "ai-service/venv/bin/python" ]]; then
  ai-service/venv/bin/python -c "import fastapi, pydantic, uvicorn, dotenv, google.generativeai; compile(open('ai-service/main.py', encoding='utf-8').read(), 'ai-service/main.py', 'exec'); print('AI service imports OK')"
else
  echo "Skipping local AI import check because ai-service venv was not found."
  echo "Run ./scripts/setup.sh to enable it, or use Docker health checks with ./scripts/backend-smoke.ps1."
fi

echo "All checks passed."
