#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command node
require_command npm
require_command dotnet
require_command python3
require_command docker

if [ ! -f ai-service/.env ]; then
  cp ai-service/.env.example ai-service/.env
  echo "Created ai-service/.env from example. Set GEMINI_API_KEY before using Gemini features."
fi

if [ ! -f infra/.env ]; then
  cp infra/.env.example infra/.env
  echo "Created infra/.env from example."
fi

if [ ! -x ai-service/venv/bin/python ]; then
  python3 -m venv ai-service/venv
fi

ai-service/venv/bin/python -m pip install --upgrade pip
ai-service/venv/bin/python -m pip install -r ai-service/requirements.txt

(cd frontend && npm install)
dotnet restore backend/InsightVault.API/InsightVault.API.csproj

mkdir -p .vscode
cat > .vscode/settings.json <<'JSON'
{
  "python.defaultInterpreterPath": "${workspaceFolder}/ai-service/venv/bin/python",
  "python.analysis.extraPaths": [
    "${workspaceFolder}/ai-service"
  ]
}
JSON

echo
echo "Setup complete."
echo "Next: update ai-service/.env, then run ./scripts/start-dev.sh"
