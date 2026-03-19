# Get Render service URL by ID. Usage: .\render-get-service-url.ps1 [-ServiceId srv-xxx]
# If ServiceId not passed, uses RENDER_BACKEND_SERVICE_ID from .env. Outputs URL to stdout.
param([string]$ServiceId = $env:RENDER_BACKEND_SERVICE_ID)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
. "$scriptDir\load-env.ps1"

if (-not $env:RENDER_API_KEY) { Write-Error "RENDER_API_KEY not set"; exit 1 }
if (-not $ServiceId) {
  if (Test-Path "$root\.env") {
    $line = Get-Content "$root\.env" | Where-Object { $_ -match "^\s*RENDER_BACKEND_SERVICE_ID=(.+)$" } | Select-Object -First 1
    if ($line -match "^\s*RENDER_BACKEND_SERVICE_ID=(.+)$") { $ServiceId = $matches[1].Trim() }
  }
  if (-not $ServiceId) { Write-Error "RENDER_BACKEND_SERVICE_ID not set and -ServiceId not passed"; exit 1 }
}

$headers = @{
  "Authorization" = "Bearer $env:RENDER_API_KEY"
  "Accept"        = "application/json"
}
$r = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId" -Headers $headers -Method Get
$s = if ($r.service) { $r.service } else { $r }
$url = $null
try { if ($s.serviceDetails.serviceDetailsMetadata.url) { $url = $s.serviceDetails.serviceDetailsMetadata.url } } catch {}
if (-not $url) { try { if ($s.serviceDetails.url) { $url = $s.serviceDetails.url } } catch {} }
if (-not $url -and $s.url) { $url = $s.url }
if (-not $url -and $s.name) { $url = "https://$($s.name -replace '\s','').onrender.com" }

if ($url) { Write-Output $url.TrimEnd('/') } else { Write-Error "Could not get service URL"; exit 1 }
