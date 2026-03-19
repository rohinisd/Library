# Run a SQL file using DATABASE_URL. Usage: .\neon-run-sql.ps1 path/to/file.sql
# Requires DATABASE_URL in .env (get from Neon dashboard or `neon connection-string`)
param([Parameter(Mandatory=$true)][string]$SqlFile)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
. "$scriptDir\neon-load-env.ps1"

if (-not $env:DATABASE_URL) {
  Write-Error "DATABASE_URL is not set in .env. Get it from Neon dashboard or run: npx neonctl connection-string --api-key `$env:NEON_API_KEY"
  exit 1
}

$absPath = if ([System.IO.Path]::IsPathRooted($SqlFile)) { $SqlFile } else { Join-Path $root $SqlFile }
if (-not (Test-Path $absPath)) {
  Write-Error "File not found: $SqlFile"
  exit 1
}

node "$root\db\run-sql.js" $absPath
