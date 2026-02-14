$ErrorActionPreference = "Stop"

$files = git ls-files "*.md"
$missing = @()

foreach ($file in $files) {
    if ($file.EndsWith(".zh-CN.md")) {
        continue
    }

    $target = $file.Substring(0, $file.Length - 3) + ".zh-CN.md"
    if (-not (Test-Path -LiteralPath $target)) {
        $missing += "missing: $target (for $file)"
    }
}

if ($missing.Count -gt 0) {
    $missing | ForEach-Object { Write-Host $_ }
    Write-Error "doc i18n check failed"
    exit 1
}

Write-Host "doc i18n check passed"
