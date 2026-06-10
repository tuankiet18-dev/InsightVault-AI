$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

Push-Location "frontend"
npm run lint
npm run build
Pop-Location

dotnet build "backend\InsightVault.slnx"
dotnet test "backend\InsightVault.slnx" --no-build

$AiPython = Join-Path $Root "ai-service\venv\Scripts\python.exe"
if (Test-Path $AiPython) {
    & $AiPython -c "import fastapi, pydantic, uvicorn, dotenv, google.generativeai; compile(open('ai-service/main.py', encoding='utf-8').read(), 'ai-service/main.py', 'exec'); print('AI service imports OK')"
}
else {
    Write-Host "Skipping local AI import check because ai-service venv was not found."
    Write-Host "Run .\scripts\setup.ps1 to enable it, or use Docker health checks with .\scripts\backend-smoke.ps1."
}

Write-Host "All checks passed."
