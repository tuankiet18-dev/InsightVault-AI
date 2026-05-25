$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

if (-not (Test-Path "ai-service\venv\Scripts\python.exe")) {
    throw "Missing ai-service venv. Run .\scripts\setup.ps1 first."
}

if (-not (Test-Path "frontend\node_modules")) {
    throw "Missing frontend node_modules. Run .\scripts\setup.ps1 first."
}

Push-Location "infra"
docker compose up -d
Pop-Location

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$Root\backend\InsightVault.API'; dotnet run --launch-profile http"
)

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$Root\ai-service'; .\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
)

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$Root\frontend'; npm run dev -- --host 127.0.0.1"
)

Write-Host "Local services are starting:"
Write-Host "- Frontend: http://localhost:5173"
Write-Host "- Backend:  http://localhost:5126/api/health"
Write-Host "- AI:       http://localhost:8000/health"
