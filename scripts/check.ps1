$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ComposeFile = Join-Path $Root "infra\docker-compose.yml"
$EnvFile = Join-Path $Root "infra\.env"
$BackendPath = Join-Path $Root "backend"

Set-Location $Root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Missing required command: docker"
}

if (-not (Test-Path $EnvFile)) {
    Copy-Item "infra\.env.example" $EnvFile
    Write-Host "Created infra\.env from example. Fill required local values, then rerun checks."
}

if (-not (Test-Path "ai-service\.env")) {
    Copy-Item "ai-service\.env.example" "ai-service\.env"
    Write-Host "Created ai-service\.env from example. Fill GEMINI_API_KEY for live AI checks."
}

docker compose --env-file $EnvFile -f $ComposeFile config --quiet
docker compose --env-file $EnvFile -f $ComposeFile build

docker compose --env-file $EnvFile -f $ComposeFile run --rm --no-deps frontend npm run lint
docker compose --env-file $EnvFile -f $ComposeFile run --rm --no-deps frontend npm run build

docker run --rm `
    -v "${BackendPath}:/src" `
    -w /src `
    mcr.microsoft.com/dotnet/sdk:10.0 `
    dotnet test InsightVault.slnx

docker compose --env-file $EnvFile -f $ComposeFile run --rm --no-deps ai-service python -c "import fastapi, pydantic, uvicorn, google.generativeai; compile(open('main.py', encoding='utf-8').read(), 'main.py', 'exec'); print('AI service imports OK')"

docker compose --env-file $EnvFile -f $ComposeFile up -d
& (Join-Path $PSScriptRoot "backend-smoke.ps1")

Write-Host "All Docker checks passed."
