$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $Name"
    }
}

Require-Command "node"
Require-Command "npm"
Require-Command "dotnet"
Require-Command "python"
Require-Command "docker"

if (-not (Test-Path "ai-service\.env")) {
    Copy-Item "ai-service\.env.example" "ai-service\.env"
    Write-Host "Created ai-service\.env from example. Set GEMINI_API_KEY before using Gemini features."
}

if (-not (Test-Path "infra\.env")) {
    Copy-Item "infra\.env.example" "infra\.env"
    Write-Host "Created infra\.env from example."
}

if (-not (Test-Path "ai-service\venv\Scripts\python.exe")) {
    python -m venv "ai-service\venv"
}

& "ai-service\venv\Scripts\python.exe" -m pip install --upgrade pip
& "ai-service\venv\Scripts\python.exe" -m pip install -r "ai-service\requirements.txt"

Push-Location "frontend"
npm install
Pop-Location

dotnet restore "backend\InsightVault.API\InsightVault.API.csproj"

New-Item -ItemType Directory -Force ".vscode" | Out-Null
@"
{
  "python.defaultInterpreterPath": "`${workspaceFolder}\\ai-service\\venv\\Scripts\\python.exe",
  "python.analysis.extraPaths": [
    "`${workspaceFolder}\\ai-service"
  ]
}
"@ | Set-Content ".vscode\settings.json" -Encoding UTF8

Write-Host ""
Write-Host "Setup complete."
Write-Host "Next: update ai-service\.env, then run .\scripts\start-dev.ps1"
