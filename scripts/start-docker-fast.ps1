$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

if (-not (Test-Path "ai-service\.env")) {
    Copy-Item "ai-service\.env.example" "ai-service\.env"
    Write-Host "Created ai-service\.env from example. Set GEMINI_API_KEY before using Gemini features."
}

if (-not (Test-Path "infra\.env")) {
    Copy-Item "infra\.env.example" "infra\.env"
    Write-Host "Created infra\.env from example."
}

Push-Location "infra"
docker compose --env-file .env up -d
Pop-Location

Write-Host "Docker stack started:"
Write-Host "- Frontend: http://localhost:5173"
Write-Host "- Backend:  http://localhost:5126/api/health"
Write-Host "- AI:       http://localhost:8000/health"
