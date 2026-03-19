# Fetch recent Render (backend) logs. Usage: .\render-logs.ps1 [-ServiceId srv-xxx] [-Lines 80]
param([string]$ServiceId = $env:RENDER_BACKEND_SERVICE_ID, [int]$Lines = 80)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
. "$scriptDir\load-env.ps1"

if (-not $ServiceId -and (Test-Path "$root\.env")) {
  $line = Get-Content "$root\.env" | Where-Object { $_ -match "^\s*RENDER_BACKEND_SERVICE_ID=(.+)$" } | Select-Object -First 1
  if ($line -match "^\s*RENDER_BACKEND_SERVICE_ID=(.+)$") { $ServiceId = $matches[1].Trim() }
}
if (-not $ServiceId) { Write-Error "RENDER_BACKEND_SERVICE_ID not set"; exit 1 }
if (-not $env:RENDER_API_KEY) { Write-Error "RENDER_API_KEY not set"; exit 1 }

Write-Host "=== Render logs (service: $ServiceId) ===" -ForegroundColor Cyan
Write-Host "Render logs API filter params vary; use Dashboard for live logs:" -ForegroundColor Gray
Write-Host "  https://dashboard.render.com -> select service '$ServiceId' -> Logs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Common causes of 500: missing DATABASE_URL/JWT_SECRET on Render, DB connection failure, unhandled exception in FastAPI." -ForegroundColor Gray
