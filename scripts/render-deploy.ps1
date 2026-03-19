# Trigger a Render deploy via API. Uses RENDER_API_KEY and RENDER_SERVICE_ID from .env.
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\render-load-env.ps1"

if (-not $env:RENDER_API_KEY) {
  Write-Error "RENDER_API_KEY is not set. Add it to .env. See RENDER_SETUP.md"
  exit 1
}
if (-not $env:RENDER_SERVICE_ID) {
  Write-Error "RENDER_SERVICE_ID is not set. Add it to .env (e.g. srv-xxxx). Run .\scripts\render-list-services.ps1 to see your services."
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $env:RENDER_API_KEY"
  "Accept"         = "application/json"
  "Content-Type"  = "application/json"
}
$uri = "https://api.render.com/v1/services/$($env:RENDER_SERVICE_ID)/deploys"
$body = "{}"
$deploy = Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $body
Write-Host "Deploy triggered: $($deploy.id) (status: $($deploy.status))" -ForegroundColor Green
Write-Host "Monitor at: https://dashboard.render.com"
