# Deploy to Fly.io. Uses FLY_API_TOKEN and optional FLY_APP_NAME from .env.
# Run from project root (where fly.toml is, or use -AppName).
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
Set-Location $root
. "$scriptDir\fly-load-env.ps1"

if (-not $env:FLY_API_TOKEN) {
  Write-Error "FLY_API_TOKEN is not set. Add it to .env. See FLY_SETUP.md"
  exit 1
}

$appArg = if ($env:FLY_APP_NAME) { @("-a", $env:FLY_APP_NAME) } else { @() }
fly deploy --access-token $env:FLY_API_TOKEN -y @appArg
