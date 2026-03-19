# Create Vercel project and link to GitHub repo if it doesn't exist.
# Usage: .\vercel-create-project.ps1 -ProjectName habit -RepoOwner rohinisd -RepoName Habit [-RootDirectory frontend]
# Uses VERCEL_TOKEN from .env. Requires Vercel GitHub app connected to the repo.
param(
  [Parameter(Mandatory=$true)][string]$ProjectName,
  [string]$RepoOwner = "rohinisd",
  [string]$RepoName = "Habit",
  [string]$RootDirectory = ""
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\load-env.ps1"

if (-not $env:VERCEL_TOKEN) {
  Write-Error "VERCEL_TOKEN is not set in .env. See VERCEL_SETUP.md"
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $env:VERCEL_TOKEN"
  "Content-Type"  = "application/json"
}
$body = @{
  name = $ProjectName
  framework = "nextjs"
  gitRepository = @{ type = "github"; repo = "$RepoOwner/$RepoName" }
}
if ($RootDirectory) { $body.rootDirectory = $RootDirectory }
$body = $body | ConvertTo-Json -Depth 3
$uri = "https://api.vercel.com/v11/projects"
if ($env:VERCEL_TEAM_ID) { $uri += "?teamId=$env:VERCEL_TEAM_ID" }
try {
  $r = Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $body
  Write-Host "Created Vercel project: $($r.name)" -ForegroundColor Green
} catch {
  $errMsg = $_.ErrorDetails.Message -join ""
  if ($_.Exception.Response.StatusCode -eq 409 -or $errMsg -match "already exists") {
    Write-Host "Vercel project '$ProjectName' already exists." -ForegroundColor Yellow
  } elseif ($errMsg -match "install the GitHub integration|Install GitHub App") {
    Write-Host "Vercel: Install GitHub app for repo $RepoOwner/$RepoName (one-time): https://github.com/apps/vercel" -ForegroundColor Yellow
    Write-Host "Opening Vercel install page - select the '$RepoName' repo, then re-run deploy for Git-linked production." -ForegroundColor Cyan
    Start-Process "https://github.com/apps/vercel/installations/new"
    Write-Host "Continuing with local deploy now..." -ForegroundColor Yellow
    exit 0
  } else { throw }
}
