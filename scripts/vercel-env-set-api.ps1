# Set Vercel project env vars via API (works for team projects; CLI env add often targets wrong project).
# Usage: .\vercel-env-set-api.ps1 [-ProjectName library]
param([string]$ProjectName = $env:NANOCLAW_APP_NAME)
if (-not $ProjectName) { $ProjectName = "library" }

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
. "$scriptDir\load-env.ps1"

function Get-EnvVal($key) {
  $v = [Environment]::GetEnvironmentVariable($key, "Process")
  if (-not $v -and (Test-Path "$root\.env")) {
    $line = Get-Content "$root\.env" | Where-Object { $_ -match "^\s*$key=(.+)$" } | Select-Object -First 1
    if ($line -match "^\s*$key=(.+)$") { $v = $matches[1].Trim() }
  }
  $v
}

if (-not (Get-EnvVal "VERCEL_TOKEN")) { Write-Error "VERCEL_TOKEN not set in .env"; exit 1 }

$backendUrl = & "$scriptDir\render-get-service-url.ps1" 2>$null
if (-not $backendUrl) { $backendUrl = "https://library-api-n9do.onrender.com" }
$jwtSecret = Get-EnvVal "JWT_SECRET"
if (-not $jwtSecret) { $jwtSecret = "library-jwt-secret-change-in-production-min-32-chars" }

$headers = @{
  "Authorization" = "Bearer $(Get-EnvVal 'VERCEL_TOKEN')"
  "Content-Type"  = "application/json"
}

# Resolve project and team (team projects need teamId for env API)
$getUri = "https://api.vercel.com/v9/projects/$ProjectName"
$teamId = Get-EnvVal "VERCEL_TEAM_ID"
if ($teamId) { $getUri += "?teamId=$teamId" }
$project = Invoke-RestMethod -Uri $getUri -Headers $headers -Method Get
if (-not $teamId -and $project.accountId -match "^team_") { $teamId = $project.accountId }

$baseUri = "https://api.vercel.com/v10/projects/$ProjectName/env"
if ($teamId) { $baseUri += "?teamId=$teamId" }
$baseUri += if ($baseUri -match "\?") { "&upsert=true" } else { "?upsert=true" }

foreach ($var in @(
  @{ key = "API_BACKEND_URL"; value = $backendUrl },
  @{ key = "JWT_SECRET"; value = $jwtSecret }
)) {
  $body = @{
    key    = $var.key
    value  = $var.value
    type   = "plain"
    target = @("production", "preview")
  } | ConvertTo-Json
  try {
    Invoke-RestMethod -Uri $baseUri -Headers $headers -Method Post -Body $body | Out-Null
    Write-Host "Set $($var.key) on Vercel project '$ProjectName'" -ForegroundColor Green
  } catch {
    Write-Warning "Failed to set $($var.key): $_"
  }
}

Write-Host "Redeploy the frontend (or wait for next Git push) for env vars to take effect." -ForegroundColor Yellow
