# Create GitHub repo if it doesn't exist. Usage: .\github-create-repo.ps1 [-Name Habit] [-Private]
# Uses GITHUB_TOKEN from .env. Repo name defaults to folder name or "Habit".
param([string]$Name = "Habit", [switch]$Private)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
. "$scriptDir\load-env.ps1"

if (-not $env:GITHUB_TOKEN) {
  Write-Error "GITHUB_TOKEN is not set in .env. See GITHUB_SETUP.md"
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $env:GITHUB_TOKEN"
  "Accept"        = "application/vnd.github+json"
  "Content-Type"  = "application/json"
}
$body = @{ name = $Name; private = [bool]$Private } | ConvertTo-Json
try {
  $r = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body
  Write-Host "Created repo: $($r.html_url)" -ForegroundColor Green
} catch {
  if ($_.Exception.Response.StatusCode -eq 422) {
    Write-Host "Repo '$Name' already exists." -ForegroundColor Yellow
  } else { throw }
}
