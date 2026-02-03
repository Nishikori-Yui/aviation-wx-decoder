param(
    [string]$BackendUrl = $env:BACKEND_URL,
    [string]$File = "",
    [string]$Message = "",
    [string]$BatchDir = "",
    [string]$Pattern = "*.txt"
)

if ([string]::IsNullOrWhiteSpace($BackendUrl)) {
    $BackendUrl = "http://127.0.0.1:17643"
}

if ([string]::IsNullOrWhiteSpace($BatchDir)) {
    if ([string]::IsNullOrWhiteSpace($Message) -and [string]::IsNullOrWhiteSpace($File)) {
        $defaultFile = Join-Path $PSScriptRoot "..\tests\fixtures\metar\001.txt"
        if (Test-Path $defaultFile) {
            $File = $defaultFile
        }
    }

    if ([string]::IsNullOrWhiteSpace($Message) -and -not [string]::IsNullOrWhiteSpace($File)) {
        $Message = Get-Content -Raw -Path $File
    }

    if ([string]::IsNullOrWhiteSpace($Message)) {
        Write-Error "No message provided. Use -Message or -File, or set -BatchDir."
        exit 1
    }
}

$healthUrl = "$($BackendUrl.TrimEnd('/'))/healthz"
$decodeUrl = "$($BackendUrl.TrimEnd('/'))/v1/decode"
$batchUrl = "$($BackendUrl.TrimEnd('/'))/v1/decode/batch"

try {
    $health = Invoke-WebRequest -Uri $healthUrl -Method Get -TimeoutSec 5
    Write-Host "Health: $($health.Content)"
} catch {
    Write-Error "Health check failed: $($_.Exception.Message)"
    exit 1
}

if (-not [string]::IsNullOrWhiteSpace($BatchDir)) {
    if (-not (Test-Path $BatchDir)) {
        Write-Error "BatchDir not found: $BatchDir"
        exit 1
    }
    $files = Get-ChildItem -Path $BatchDir -Filter $Pattern | Sort-Object Name
    if ($files.Count -eq 0) {
        Write-Error "No files found in BatchDir: $BatchDir"
        exit 1
    }
    $messages = @()
    foreach ($fileItem in $files) {
        $messages += (Get-Content -Raw -Path $fileItem.FullName).Trim()
    }

    $payload = @{
        messages = $messages
        type = "auto"
        output = @{ json = $true; explain = $true }
        lang = "zh-CN"
        detail = "normal"
    } | ConvertTo-Json -Depth 5

    try {
        $resp = Invoke-WebRequest -Uri $batchUrl -Method Post -ContentType "application/json" -Body $payload -TimeoutSec 20
        Write-Host "Batch decode status: $($resp.StatusCode)"
        $resp.Content
    } catch {
        Write-Error "Batch decode failed: $($_.Exception.Message)"
        exit 1
    }
} else {
    $payload = @{
        message = $Message.Trim()
        type = "auto"
        output = @{ json = $true; explain = $true }
        lang = "zh-CN"
        detail = "normal"
    } | ConvertTo-Json -Depth 5

    try {
        $resp = Invoke-WebRequest -Uri $decodeUrl -Method Post -ContentType "application/json" -Body $payload -TimeoutSec 10
        Write-Host "Decode status: $($resp.StatusCode)"
        $resp.Content
    } catch {
        Write-Error "Decode failed: $($_.Exception.Message)"
        exit 1
    }
}
