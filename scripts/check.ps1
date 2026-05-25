$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

Push-Location "frontend"
npm run lint
npm run build
Pop-Location

dotnet build "backend\InsightVault.API\InsightVault.API.csproj"

& "ai-service\venv\Scripts\python.exe" -c "import fastapi, pydantic, uvicorn, dotenv, google.generativeai; compile(open('ai-service/main.py', encoding='utf-8').read(), 'ai-service/main.py', 'exec'); print('AI service imports OK')"

Write-Host "All checks passed."
