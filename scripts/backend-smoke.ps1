param(
    [string]$BackendBaseUrl = "http://localhost:5126",
    [string]$AiServiceBaseUrl = "http://localhost:8000",
    [int]$Retries = 20,
    [int]$RetryDelaySeconds = 3,
    [switch]$SkipReady
)

$ErrorActionPreference = "Stop"

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url
    )

    Write-Host "Checking ${Name}: $Url"

    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec 15

            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                Write-Host "$Name OK ($($response.StatusCode))"
                return
            }

            $lastError = "$Name returned HTTP $($response.StatusCode)."
        }
        catch {
            $lastError = $_.Exception.Message
        }

        if ($attempt -lt $Retries) {
            Write-Host "$Name not ready yet (attempt $attempt/$Retries). Retrying in $RetryDelaySeconds seconds..."
            Start-Sleep -Seconds $RetryDelaySeconds
        }
    }

    throw "$Name failed after $Retries attempts. Last error: $lastError"
}

$backend = $BackendBaseUrl.TrimEnd("/")
$aiService = $AiServiceBaseUrl.TrimEnd("/")

Test-Endpoint "Backend liveness" "$backend/health/live"

if (-not $SkipReady) {
    Test-Endpoint "Backend readiness" "$backend/health/ready"
}

Test-Endpoint "Backend API health" "$backend/api/health"
Test-Endpoint "AI service health" "$aiService/health"

Write-Host "Backend smoke checks passed."
