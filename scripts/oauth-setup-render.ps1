# Push Google OAuth env vars to Render and run DB migration. Run from repo root.
# One-time: Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL to .env (from Google Cloud Console).
# Usage: .\scripts\oauth-setup-render.ps1
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
Set-Location $root
. "$scriptDir\load-env.ps1"

function Get-EnvVal($key) {
  $v = [Environment]::GetEnvironmentVariable($key, "Process")
  if (-not $v -and (Test-Path "$root\.env")) {
    $line = Get-Content "$root\.env" | Where-Object { $_ -match "^\s*$key=(.+)$" } | Select-Object -First 1
    if ($line -match "^\s*$key=(.+)$") { $v = $matches[1].Trim() }
  }
  $v
}

$serviceId = Get-EnvVal "RENDER_BACKEND_SERVICE_ID"
if (-not $serviceId) {
  Write-Error "RENDER_BACKEND_SERVICE_ID missing in .env. Run nanoclaw or render-setup-backend first."
  exit 1
}
if (-not $env:RENDER_API_KEY) { Write-Error "RENDER_API_KEY missing in .env"; exit 1 }

$headers = @{
  "Authorization" = "Bearer $env:RENDER_API_KEY"
  "Accept"        = "application/json"
  "Content-Type"  = "application/json"
}

$oauthVars = @("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "FRONTEND_URL")
foreach ($key in $oauthVars) {
  $val = Get-EnvVal $key
  if (-not $val) {
    Write-Warning "Skip $key (not in .env). Add it from Google Cloud Console → Credentials → OAuth client."
    continue
  }
  $body = @{ value = $val } | ConvertTo-Json
  try {
    Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars/$key" -Headers $headers -Method Put -Body $body | Out-Null
    Write-Host "Set $key on Render" -ForegroundColor Green
  } catch {
    Write-Warning "Could not set $key : $_"
  }
}

Write-Host "Running DB migration (002_oauth)..." -ForegroundColor Yellow
& npm run db:migrate-all 2>&1
if ($LASTEXITCODE -ne 0) { Write-Warning "Migration failed or already applied." }

Write-Host ""
Write-Host "Triggering Render deploy so new OAuth env vars load..." -ForegroundColor Yellow
& "$scriptDir\render-deploy.ps1" 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { Write-Warning "Deploy script failed; trigger a manual deploy in Render or run .\scripts\render-deploy.ps1" }

Write-Host ""
Write-Host "OAuth setup done." -ForegroundColor Green
Write-Host "Ensure in Google Console: Authorized redirect URI = https://YOUR-BACKEND-URL/api/auth/google/callback" -ForegroundColor Cyan
Write-Host "Authorized JavaScript origins = your FRONTEND_URL (exact production URL)." -ForegroundColor Cyan
