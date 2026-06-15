$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ComposeFile = Join-Path $Root "infra\docker-compose.yml"
$EnvFile = Join-Path $Root "infra\.env"

Set-Location $Root

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $Name"
    }
}

Require-Command "docker"

if (-not (Test-Path "ai-service\.env")) {
    Copy-Item "ai-service\.env.example" "ai-service\.env"
    Write-Host "Created ai-service\.env from example. Set GEMINI_API_KEY before using AI features."
}

if (-not (Test-Path "infra\.env")) {
    Copy-Item "infra\.env.example" "infra\.env"
    Write-Host "Created infra\.env from example."
}

docker compose --env-file $EnvFile -f $ComposeFile config --quiet
docker compose --env-file $EnvFile -f $ComposeFile build

Write-Host ""
Write-Host "Docker setup complete."
Write-Host "Next: update infra\.env and ai-service\.env, then run .\scripts\start-docker-fast.ps1"
