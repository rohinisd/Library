# List Render services (to find RENDER_SERVICE_ID). Uses RENDER_API_KEY from .env.
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\render-load-env.ps1"

if (-not $env:RENDER_API_KEY) {
  Write-Error "RENDER_API_KEY is not set. Add it to .env. See RENDER_SETUP.md"
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $env:RENDER_API_KEY"
  "Accept"        = "application/json"
}
$resp = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=20" -Headers $headers -Method Get
if ($resp.Count -eq 0) {
  Write-Host "No services found. Create a Web Service in the Render dashboard first."
  exit 0
}
Write-Host "=== Render services (use 'id' as RENDER_SERVICE_ID) ===" -ForegroundColor Cyan
$resp | ForEach-Object { Write-Host "  $($_.name)  id: $($_.id)" }
