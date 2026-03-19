# Create Render Web Service via API. Uses RENDER_API_KEY and RENDER_OWNER_ID from .env.
# Usage: .\render-create-service.ps1 -Name habit-api -RepoUrl https://github.com/rohinisd/Habit -Branch main [-RootDir backend] [-DockerfilePath backend/Dockerfile]
# If RENDER_OWNER_ID is not set, tries to get it from existing services (run render-list-services.ps1 first).
param(
  [Parameter(Mandatory=$true)][string]$Name,
  [Parameter(Mandatory=$true)][string]$RepoUrl,
  [string]$Branch = "main",
  [string]$RootDir = "",
  [string]$DockerfilePath = "backend/Dockerfile",
  [string]$DockerContext = "."
)

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
$body = @{
  type = "web_service"
  name = $Name
  ownerId = $env:RENDER_OWNER_ID
  repo = $RepoUrl
  branch = $Branch
  runtime = "docker"
  dockerfilePath = $DockerfilePath
  dockerContext = $DockerContext
}
if ($RootDir) { $body.rootDir = $RootDir }
$payload = $body | ConvertTo-Json

try {
  $r = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers -Method Post -Body $payload
  Write-Host "Created Render service: $($r.service.name) id: $($r.service.id)" -ForegroundColor Green
  Write-Host "Add to .env: RENDER_SERVICE_ID=$($r.service.id)"
} catch { throw }