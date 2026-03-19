# Add env vars from .env to the linked Vercel project. Usage: .\vercel-env-add.ps1
# Requires: .env with VERCEL_TOKEN and vars to sync (e.g. DATABASE_URL)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root
. "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\load-env.ps1"

if (-not $env:VERCEL_TOKEN) {
    Write-Error "VERCEL_TOKEN is not set in .env"
    exit 1
}

$vars = @("DATABASE_URL")
foreach ($name in $vars) {
    $val = [Environment]::GetEnvironmentVariable($name, "Process")
    if (-not $val) {
        if (Test-Path ".env") {
            $line = Get-Content ".env" | Where-Object { $_ -match "^\s*$name=(.+)$" } | Select-Object -First 1
            if ($line -match "^\s*$name=(.+)$") { $val = $matches[1].Trim() }
        }
    }
    if ($val) {
        Write-Host "Adding $name to production and preview..."
        & npx vercel env add $name production --value $val --yes --token $env:VERCEL_TOKEN 2>&1
        & npx vercel env add $name preview --value $val --yes --token $env:VERCEL_TOKEN 2>&1
    }
    else { Write-Warning "Skip $name (not set)" }
}
Write-Host "Done."
