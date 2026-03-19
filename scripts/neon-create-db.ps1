# Create a Neon database. Usage: .\neon-create-db.ps1 -Name mydb
# Requires NEON_API_KEY (and optionally NEON_PROJECT_ID) in .env
param([Parameter(Mandatory=$true)][string]$Name)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\neon-load-env.ps1"

if (-not $env:NEON_API_KEY) {
  Write-Error "NEON_API_KEY is not set. Add it to .env. See NEON_SETUP.md"
  exit 1
}

$projectArg = if ($env:NEON_PROJECT_ID) { @("--project-id", $env:NEON_PROJECT_ID) } else { @() }
npx neonctl databases create --name $Name --api-key $env:NEON_API_KEY @projectArg
