$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root

$targets = @(
    "frontend\dist",
    "frontend\.vite",
    "backend\InsightVault.API\bin",
    "backend\InsightVault.API\obj",
    "backend\InsightVault.API.Tests\bin",
    "backend\InsightVault.API.Tests\obj",
    "ai-service\__pycache__",
    "ai-service\.pytest_cache",
    "ai-service\notebooks\.ipynb_checkpoints",
    ".pytest_cache",
    "test-artifacts"
)

foreach ($target in $targets) {
    $resolved = [System.IO.Path]::GetFullPath((Join-Path $Root $target))
    if (-not $resolved.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Unsafe path: $resolved"
    }

    if (Test-Path -LiteralPath $resolved) {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}

Write-Host "Clean complete."
