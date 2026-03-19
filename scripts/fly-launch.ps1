# Create and deploy a new Fly app (non-interactive). Usage: .\fly-launch.ps1 -Name myapp [-Region ams]
# Requires FLY_API_TOKEN in .env. Run from project root (with Dockerfile or fly.toml optional).
param(
  [Parameter(Mandatory=$true)][string]$Name,
  [string]$Region = "ams"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
Set-Location $root
. "$scriptDir\fly-load-env.ps1"

if (-not $env:FLY_API_TOKEN) {
  Write-Error "FLY_API_TOKEN is not set. Add it to .env. See FLY_SETUP.md"
  exit 1
}

$env:FLYCTL_INTERACTIVE = "0"
fly launch --name $Name --region $Region --access-token $env:FLY_API_TOKEN --yes --now
