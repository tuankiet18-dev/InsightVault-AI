#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

(cd frontend && npm run lint && npm run build)
dotnet build backend/InsightVault.API/InsightVault.API.csproj
ai-service/venv/bin/python -c "import fastapi, pydantic, uvicorn, dotenv, google.generativeai; compile(open('ai-service/main.py', encoding='utf-8').read(), 'ai-service/main.py', 'exec'); print('AI service imports OK')"

echo "All checks passed."
