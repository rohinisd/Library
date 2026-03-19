# Get Vercel project info (including Git link). Usage: .\vercel-project-info.ps1 [-ProjectName library]
# Use this to confirm which repo is connected to the project. Requires VERCEL_TOKEN in .env.
param([string]$ProjectName = $env:NANOCLAW_APP_NAME)
if (-not $ProjectName) { $ProjectName = "library" }

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\load-env.ps1"

if (-not $env:VERCEL_TOKEN) {
  Write-Error "VERCEL_TOKEN not set in .env"
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $env:VERCEL_TOKEN"
  "Accept"        = "application/json"
}
$uri = "https://api.vercel.com/v9/projects/$ProjectName"
if ($env:VERCEL_TEAM_ID) { $uri += "?teamId=$env:VERCEL_TEAM_ID" }

try {
  $p = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
} catch {
  Write-Host "Project '$ProjectName' not found or no access. Create it first or check the name." -ForegroundColor Red
  exit 1
}

Write-Host "Project: $($p.name) (id: $($p.id))" -ForegroundColor Green
if ($p.link) {
  Write-Host "Link type: $($p.link.type)" -ForegroundColor Cyan
  if ($p.link.repo) { Write-Host "Git repo: $($p.link.repo)" -ForegroundColor Cyan }
  if ($p.link.repoId) { Write-Host "Repo ID: $($p.link.repoId)" -ForegroundColor Cyan }
}
if ($p.rootDirectory) { Write-Host "Root directory: $($p.rootDirectory)" -ForegroundColor Cyan }
# Some API versions use different shape
if ($p.link -eq $null -and $p.projectId) {
  Write-Host "Project ID: $($p.projectId)" -ForegroundColor Cyan
}
# Output link/repo for quick check
if ($p.link) {
  Write-Host "Connected repo: $($p.link.repo)" -ForegroundColor Green
} else {
  Write-Host "No Git repo connected. Production may be serving old or wrong code." -ForegroundColor Red
}

Write-Host ""
Write-Host "To connect the correct repo in Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "  1. Open https://vercel.com/dashboard" -ForegroundColor White
Write-Host "  2. Click project '$ProjectName' (or $($p.name))" -ForegroundColor White
Write-Host "  3. Settings -> Git -> Connect Git Repository" -ForegroundColor White
Write-Host "  4. Choose the repo where THIS code lives (e.g. paas-full-template or your fork)" -ForegroundColor White
Write-Host "  5. Set Root Directory to 'frontend' if it's a monorepo" -ForegroundColor White
Write-Host "  6. Save. Trigger a redeploy (Deployments -> ... -> Redeploy) or push to main." -ForegroundColor White
