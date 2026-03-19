# Fetch recent Vercel (frontend) logs. Usage: .\vercel-logs.ps1 [-ProjectName library] [-Lines 50]
param([string]$ProjectName = $env:NANOCLAW_APP_NAME, [int]$Lines = 80)
if (-not $ProjectName) { $ProjectName = "library" }

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\load-env.ps1"

if (-not $env:VERCEL_TOKEN) { Write-Error "VERCEL_TOKEN not set in .env"; exit 1 }

# Use CLI (runtime-logs API is streaming and can hang)
Write-Host "=== Vercel logs (project: $ProjectName) - fetching via CLI ===" -ForegroundColor Cyan
$frontendPath = Join-Path (Split-Path -Parent $scriptDir) "frontend"
Push-Location $frontendPath
try {
  $out = & npx vercel logs --project $ProjectName --token $env:VERCEL_TOKEN 2>&1
  $out | Select-Object -First $Lines | ForEach-Object {
    if ($_ -match "error|Error|500|fail|Fail") { Write-Host $_ -ForegroundColor Red }
    elseif ($_ -match "warn|Warn") { Write-Host $_ -ForegroundColor Yellow }
    else { Write-Host $_ }
  }
} catch {
  Write-Host "CLI error: $_" -ForegroundColor Red
  Write-Host "View logs at: https://vercel.com/dashboard -> $ProjectName -> Deployments -> select deployment -> Logs" -ForegroundColor Yellow
} finally {
  Pop-Location
}
