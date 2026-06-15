#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Local split-process development is disabled for this project."
echo "Starting the full Docker Compose stack instead..."

./scripts/start-docker.sh
