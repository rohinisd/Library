# Get Neon connection string and optionally update .env with DATABASE_URL.
# Usage: .\neon-connection-string.ps1           (print only)
#        .\neon-connection-string.ps1 -UpdateEnv (append DATABASE_URL to .env)
#        .\neon-connection-string.ps1 -Pooled    (use pooled connection, good for serverless)
param([switch]$UpdateEnv, [switch]$Pooled)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
. "$scriptDir\neon-load-env.ps1"

if (-not $env:NEON_API_KEY) {
  Write-Error "NEON_API_KEY is not set. Add it to .env. See NEON_SETUP.md"
  exit 1
}

$projectArg = if ($env:NEON_PROJECT_ID) { @("--project-id", $env:NEON_PROJECT_ID) } else { @() }
$pooledArg = if ($Pooled) { @("--pooled") } else { @() }
$conn = npx neonctl connection-string --api-key $env:NEON_API_KEY @projectArg @pooledArg 2>&1 | Out-String
$conn = $conn.Trim()
if (-not $conn -or $conn -match "error|Error") {
  Write-Error "Failed to get connection string. Ensure you have a Neon project and default branch/database."
  exit 1
}

Write-Host $conn

if ($UpdateEnv) {
  $envPath = Join-Path $root ".env"
  $line = "DATABASE_URL=$conn"
  $content = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
  if ($content -match "DATABASE_URL=") {
    $content = $content -replace "DATABASE_URL=.*", $line
  } else {
    $content = $content.TrimEnd() + "`n$line`n"
  }
  Set-Content -Path $envPath -Value $content.TrimEnd() -NoNewline
  Write-Host "Updated .env with DATABASE_URL" -ForegroundColor Green
}
