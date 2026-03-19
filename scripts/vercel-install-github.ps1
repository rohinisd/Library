# Open the Vercel GitHub App install page so you can install it on your repo (one-time).
# Usage: .\vercel-install-github.ps1 [RepoOwner/RepoName]
# You must click "Install" and select the repo in the browser; this cannot be done via API with a user token.
param([string]$Repo = "rohinisd/Habit")

Write-Host "Opening Vercel for GitHub install page. In the browser: click Install, then select the repo(s) and authorize." -ForegroundColor Cyan
Start-Process "https://github.com/apps/vercel/installations/new"
if ($Repo) {
  Write-Host "After installing, ensure '$Repo' is selected (or 'All repositories')." -ForegroundColor Yellow
}
