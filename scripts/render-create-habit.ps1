# Create Render Web Service for Habit (Next.js in Docker). Uses RENDER_* from .env.
# Usage: .\render-create-habit.ps1
# Run once to create the service; then add DATABASE_URL in Render dashboard and use render-deploy.ps1 (with RENDER_SERVICE_ID for this service) to deploy.
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\load-env.ps1"

if (-not $env:RENDER_API_KEY) {
  Write-Error "RENDER_API_KEY is not set in .env. See RENDER_SETUP.md"
  exit 1
}

if (-not $env:RENDER_OWNER_ID) {
  $listHeaders = @{ "Authorization" = "Bearer $env:RENDER_API_KEY"; "Accept" = "application/json" }
  $list = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=1" -Headers $listHeaders -Method Get
  $ownerId = $list.service.ownerId
  if (-not $ownerId) { Write-Error "Could not get RENDER_OWNER_ID. Set it in .env (e.g. tea-xxxx)."; exit 1 }
  $env:RENDER_OWNER_ID = $ownerId
}

$headers = @{
  "Authorization" = "Bearer $env:RENDER_API_KEY"
  "Accept"        = "application/json"
  "Content-Type"  = "application/json"
}
$repoUrl = "https://github.com/rohinisd/Habit"
$body = @{
  type = "web_service"
  name = "habit"
  ownerId = $env:RENDER_OWNER_ID
  repo = $repoUrl
  branch = "main"
  serviceDetails = @{
    env = "docker"
    plan = "free"
    region = "oregon"
    envSpecificDetails = @{
      dockerfilePath = "Dockerfile"
      dockerContext = "."
    }
  }
} | ConvertTo-Json -Depth 5

try {
  $r = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers -Method Post -Body $body
  Write-Host "Created Render service: $($r.service.name) id: $($r.service.id)" -ForegroundColor Green
  Write-Host "Add DATABASE_URL in Render dashboard: https://dashboard.render.com → $($r.service.name) → Environment"
  Write-Host "For deploy script, add to .env: RENDER_HABIT_SERVICE_ID=$($r.service.id)"
} catch {
  if ($_.Exception.Response.StatusCode -eq 409 -or $_.ErrorDetails.Message -match "already exists") {
    Write-Host "Render service 'habit' may already exist. List services: .\scripts\render-list-services.ps1" -ForegroundColor Yellow
  } elseif ($_.ErrorDetails.Message -match "invalid or unfetchable") {
    Write-Host "Connect the Habit repo to Render first: dashboard.render.com → New → Web Service → connect GitHub → select Habit. See RENDER_HABIT.md." -ForegroundColor Yellow
  } else { throw }
}
