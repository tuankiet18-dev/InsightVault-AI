$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root

Write-Host "Local split-process development is disabled for this project."
Write-Host "Starting the full Docker Compose stack instead..."

& (Join-Path $PSScriptRoot "start-docker-fast.ps1")
