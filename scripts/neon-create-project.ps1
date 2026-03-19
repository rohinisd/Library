# Create a Neon project via API. Usage: .\neon-create-project.ps1 -Name habit [-UpdateEnv]
# Uses NEON_API_KEY from .env. If -UpdateEnv, writes first connection URI to .env as DATABASE_URL and project id as NEON_PROJECT_ID.
param(
  [Parameter(Mandatory=$true)][string]$Name,
  [switch]$UpdateEnv
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
. "$scriptDir\load-env.ps1"

if (-not $env:NEON_API_KEY) {
  Write-Error "NEON_API_KEY is not set in .env. See NEON_SETUP.md"
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $env:NEON_API_KEY"
  "Accept"        = "application/json"
  "Content-Type"  = "application/json"
}
$body = @{ project = @{ name = $Name } } | ConvertTo-Json -Depth 3
$r = Invoke-RestMethod -Uri "https://console.neon.tech/api/v2/projects" -Headers $headers -Method Post -Body $body

$projectId = $r.project.id
$connUri = $null
if ($r.connection_uris -and $r.connection_uris.Count -gt 0) { $connUri = $r.connection_uris[0].connection_uri }
Write-Host "Created Neon project: $Name (id: $projectId)" -ForegroundColor Green
if ($connUri) { Write-Host "Connection URI: $connUri" }

if ($UpdateEnv -and $connUri) {
  $envPath = Join-Path $root ".env"
  $content = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
  $line = "DATABASE_URL=$connUri"
  if ($content -match "DATABASE_URL=") { $content = $content -replace "#?\s*DATABASE_URL=.*", $line }
  else { $content = $content.TrimEnd() + "`n$line`n" }
  if ($content -match "NEON_PROJECT_ID=") { $content = $content -replace "#?\s*NEON_PROJECT_ID=.*", "NEON_PROJECT_ID=$projectId" }
  else { $content = $content.TrimEnd() + "`nNEON_PROJECT_ID=$projectId`n" }
  Set-Content -Path $envPath -Value $content.TrimEnd() -NoNewline
  Write-Host "Updated .env with DATABASE_URL and NEON_PROJECT_ID" -ForegroundColor Green
}
