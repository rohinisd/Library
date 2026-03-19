# Create backend API (Docker) on Render, set ALL env vars, trigger deploy. One script = full Render setup.
# If service already exists: finds it by name, syncs all env vars from .env, triggers deploy.
# Prerequisite: Connect your GitHub repo in Render once (Dashboard -> New -> Web Service -> connect GitHub).
# Usage: .\render-setup-backend.ps1 [-ServiceName habit-api] [-RepoUrl https://github.com/owner/repo] [-RootDir backend]
param(
  [string]$ServiceName = $env:RENDER_BACKEND_SERVICE_NAME,
  [string]$RepoUrl = $env:GITHUB_REPO_URL,
  [string]$RootDir = "backend"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
. "$scriptDir\load-env.ps1"

if (-not $ServiceName) { $ServiceName = "habit-api" }
if (-not $RepoUrl) { $RepoUrl = "https://github.com/rohinisd/Habit" }

if (-not $env:RENDER_API_KEY) { Write-Error "RENDER_API_KEY not set"; exit 1 }
if (-not $env:RENDER_OWNER_ID) {
  $h = @{ "Authorization" = "Bearer $env:RENDER_API_KEY"; "Accept" = "application/json" }
  $r = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=1" -Headers $h -Method Get
  $env:RENDER_OWNER_ID = $r.service.ownerId
}
if (-not $env:DATABASE_URL) { Write-Error "DATABASE_URL not set in .env"; exit 1 }
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = "habit-jwt-secret-change-me-min-32-chars-long" }

$headers = @{
  "Authorization" = "Bearer $env:RENDER_API_KEY"
  "Accept"        = "application/json"
  "Content-Type"  = "application/json"
}

function Get-EnvVal($key) {
  $v = [Environment]::GetEnvironmentVariable($key, "Process")
  if (-not $v -and (Test-Path "$root\.env")) {
    $line = Get-Content "$root\.env" | Where-Object { $_ -match "^\s*$key=(.+)$" } | Select-Object -First 1
    if ($line -match "^\s*$key=(.+)$") { $v = $matches[1].Trim() }
  }
  $v
}

function Set-RenderEnvVars($sid) {
  $allKeys = @("DATABASE_URL", "JWT_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "FRONTEND_URL")
  foreach ($key in $allKeys) {
    $val = Get-EnvVal $key
    if ($val) {
      $body = @{ value = $val } | ConvertTo-Json
      try {
        Invoke-RestMethod -Uri "https://api.render.com/v1/services/$sid/env-vars/$key" -Headers $headers -Method Put -Body $body | Out-Null
        Write-Host "Set $key on Render" -ForegroundColor Green
      } catch { Write-Warning "Could not set $key : $_" }
    }
  }
}

# 1) Create service or get existing
$createBody = @{
  type     = "web_service"
  name     = $ServiceName
  ownerId  = $env:RENDER_OWNER_ID
  repo     = $RepoUrl
  branch   = "main"
  rootDir  = $RootDir
  serviceDetails = @{
    env      = "docker"
    plan     = "free"
    region   = "oregon"
    envSpecificDetails = @{ dockerfilePath = "Dockerfile"; dockerContext = "." }
  }
} | ConvertTo-Json -Depth 5

$serviceId = $null
try {
  $sr = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers -Method Post -Body $createBody
  $serviceId = $sr.id
  Write-Host "Created service: $ServiceName ($serviceId)" -ForegroundColor Green
} catch {
  $errMsg = $_.ErrorDetails.Message -join ""
  if ($errMsg -match "already exists|already in use") {
    Write-Host "$ServiceName already exists. Looking up service and syncing env vars..." -ForegroundColor Yellow
    $list = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers -Method Get
    $arr = @($list)
    foreach ($s in $arr) {
      $n = $s.name; if (-not $n -and $s.service) { $n = $s.service.name }
      if ($n -eq $ServiceName) { $serviceId = $s.id; if (-not $serviceId -and $s.service) { $serviceId = $s.service.id }; break }
    }
    if (-not $serviceId) { Write-Error "Could not find existing service '$ServiceName'. Create it in Render dashboard or use a different name."; exit 1 }
    Write-Host "Found service: $serviceId" -ForegroundColor Green
  } else {
    if ($_.ErrorDetails.Message -match "invalid or unfetchable") {
      Write-Host "Connect your repo in Render first: Dashboard -> New -> Web Service -> connect GitHub -> select your repo." -ForegroundColor Yellow
      exit 1
    }
    throw
  }
}

# 2) Set all env vars (DB, JWT, OAuth)
Set-RenderEnvVars $serviceId

# 3) Trigger deploy
try {
  $dr = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys" -Headers $headers -Method Post -Body "{}"
  Write-Host "Deploy triggered: $($dr.id)" -ForegroundColor Green
} catch { Write-Warning "Deploy trigger failed: $_" }

# 4) Write service ID to .env
$envPath = Join-Path $root ".env"
$content = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
$line = "RENDER_BACKEND_SERVICE_ID=$serviceId"
if ($content -match "RENDER_BACKEND_SERVICE_ID=") { $content = $content -replace "RENDER_BACKEND_SERVICE_ID=.*", $line }
else { $content = $content.TrimEnd() + "`n$line`n" }
Set-Content -Path $envPath -Value $content.TrimEnd() -NoNewline

# 5) Output backend URL (for Google redirect URI etc.)
$backendUrl = ""
try {
  $backendUrl = & "$scriptDir\render-get-service-url.ps1" -ServiceId $serviceId 2>$null
  if ($backendUrl) {
    Write-Host ""
    Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
    Write-Host "Google redirect URI: $backendUrl/api/auth/google/callback" -ForegroundColor Cyan
  }
} catch {}
Write-Host "Done. Add API_BACKEND_URL to Vercel (use the backend URL above) if not already set." -ForegroundColor Green
