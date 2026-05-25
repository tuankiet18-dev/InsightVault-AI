$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

$targets = @(
    "frontend\dist",
    "backend\InsightVault.API\bin",
    "backend\InsightVault.API\obj",
    "ai-service\__pycache__",
    "ai-service\notebooks\.ipynb_checkpoints"
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
