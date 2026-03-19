# List Neon projects and databases. Uses NEON_API_KEY from .env.
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\neon-load-env.ps1"

if (-not $env:NEON_API_KEY) {
  Write-Error "NEON_API_KEY is not set. Add it to .env. See NEON_SETUP.md"
  exit 1
}

Write-Host "=== Projects ===" -ForegroundColor Cyan
npx neonctl projects list --api-key $env:NEON_API_KEY

Write-Host "`n=== Databases (default branch) ===" -ForegroundColor Cyan
$projectArg = if ($env:NEON_PROJECT_ID) { @("--project-id", $env:NEON_PROJECT_ID) } else { @() }
npx neonctl databases list --api-key $env:NEON_API_KEY @projectArg
