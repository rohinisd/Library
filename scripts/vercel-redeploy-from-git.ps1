# Trigger a production deployment from the linked Git repo (forces Vercel to build from GitHub).
# Usage: .\vercel-redeploy-from-git.ps1 [-ProjectName library] [-Branch main]
param([string]$ProjectName = "library", [string]$Branch = "main")

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\load-env.ps1"

if (-not $env:VERCEL_TOKEN) { Write-Error "VERCEL_TOKEN not set in .env"; exit 1 }

# Get project to obtain repo link (org/repo)
$headers = @{
  "Authorization" = "Bearer $env:VERCEL_TOKEN"
  "Content-Type"  = "application/json"
  "Accept"       = "application/json"
}
$getUri = "https://api.vercel.com/v9/projects/$ProjectName"
if ($env:VERCEL_TEAM_ID) { $getUri += "?teamId=$env:VERCEL_TEAM_ID" }
$project = Invoke-RestMethod -Uri $getUri -Headers $headers -Method Get

$repo = $project.link.repo
if (-not $repo) { Write-Error "Project has no Git repo linked. Link repo in Vercel Dashboard first."; exit 1 }
# repo is like "Library" (name only); we need org. Try project.ownerId or parse from project.
$org = "rohinisd"
if ($project.link.org) { $org = $project.link.org }
# Repo name might be full "owner/repo" in some APIs
if ($repo -match "^([^/]+)/(.+)$") { $org = $matches[1]; $repo = $matches[2] }

$body = @{
  name      = $ProjectName
  target    = "production"
  gitSource = @{ type = "github"; ref = $Branch; org = $org; repo = $repo }
} | ConvertTo-Json -Depth 4

$postUri = "https://api.vercel.com/v13/deployments"
if ($env:VERCEL_TEAM_ID) { $postUri += "?teamId=$env:VERCEL_TEAM_ID" }
Write-Host "Triggering production deploy from Git: $org/$repo @ $Branch..." -ForegroundColor Cyan
$r = Invoke-RestMethod -Uri $postUri -Headers $headers -Method Post -Body $body
Write-Host "Deployment started: $($r.url) (id: $($r.id))" -ForegroundColor Green
Write-Host "Wait 1-2 min then open https://$ProjectName.vercel.app and hard-refresh (Ctrl+Shift+R)." -ForegroundColor Yellow
