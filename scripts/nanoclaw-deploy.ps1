# Nanoclaw: one-shot full deploy. Run from repo root. Gives you frontend + backend URLs when done.
# Prereqs: .env with NEON_API_KEY, RENDER_API_KEY, VERCEL_TOKEN. One-time: connect repo in Render (dashboard.render.com).
# Optional: GITHUB_TOKEN + gh CLI for setting DATABASE_URL secret; GITHUB_REPO_URL or git remote origin.
# Usage: .\scripts\nanoclaw-deploy.ps1 [-AppName habit]
param([string]$AppName = $env:NANOCLAW_APP_NAME)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
Set-Location $root
. "$scriptDir\load-env.ps1"

if (-not $AppName) { $AppName = "habit" }

function Ensure-Env($key) {
  $v = [Environment]::GetEnvironmentVariable($key, "Process")
  if (-not $v -and (Test-Path "$root\.env")) {
    $line = Get-Content "$root\.env" | Where-Object { $_ -match "^\s*$key=(.+)$" } | Select-Object -First 1
    if ($line -match "^\s*$key=(.+)$") { $v = $matches[1].Trim() }
  }
  $v
}

# ----- Preflight -----
Write-Host "Nanoclaw: full deploy for $AppName" -ForegroundColor Cyan
if (-not (Ensure-Env "NEON_API_KEY")) { Write-Error "NEON_API_KEY missing in .env"; exit 1 }
if (-not (Ensure-Env "RENDER_API_KEY")) { Write-Error "RENDER_API_KEY missing in .env"; exit 1 }
if (-not (Ensure-Env "VERCEL_TOKEN")) { Write-Error "VERCEL_TOKEN missing in .env"; exit 1 }

# ----- 1) Neon: ensure DATABASE_URL -----
if (-not (Ensure-Env "DATABASE_URL")) {
  Write-Host "Creating Neon project and DATABASE_URL..." -ForegroundColor Yellow
  & "$scriptDir\neon-create-project.ps1" -Name $AppName -UpdateEnv
  . "$scriptDir\load-env.ps1"
}
if (-not (Ensure-Env "DATABASE_URL")) { Write-Error "DATABASE_URL still not set"; exit 1 }

# ----- 2) Run migrations (ensure root deps installed for pg) -----
Write-Host "Ensuring root dependencies (pg for migrations)..." -ForegroundColor Yellow
& npm install 2>&1 | Out-Null
Write-Host "Running DB migrations..." -ForegroundColor Yellow
$prevErrPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$migrateOut = & node db/run-all-migrations.js 2>&1 | Out-String
$ErrorActionPreference = $prevErrPref
if ($LASTEXITCODE -ne 0) { Write-Warning "Migrations failed: $migrateOut"; $LASTEXITCODE = 0 }
elseif ($migrateOut) { Write-Host $migrateOut.Trim() }

# ----- 3) GitHub Actions secret (optional; skip if not a git repo) -----
$isGitRepo = Test-Path (Join-Path $root ".git")
if ($isGitRepo -and (Ensure-Env "GITHUB_TOKEN")) {
  $env:GITHUB_TOKEN = Ensure-Env "GITHUB_TOKEN"
  $ErrorActionPreference = "Continue"
  $null = & gh secret set DATABASE_URL --body (Ensure-Env "DATABASE_URL") 2>&1
  $ErrorActionPreference = "Stop"
  if ($LASTEXITCODE -eq 0) { Write-Host "Set GitHub Actions secret DATABASE_URL" -ForegroundColor Green }
  else { Write-Host "GitHub secret: add DATABASE_URL in repo Settings -> Secrets -> Actions" -ForegroundColor Yellow }
} elseif (-not $isGitRepo) {
  Write-Host "Skipping GitHub secret (not a git repo). Push to GitHub first for CI migrations." -ForegroundColor Yellow
} else {
  Write-Host "Add DATABASE_URL in GitHub repo -> Settings -> Secrets -> Actions (for migrations on push)" -ForegroundColor Yellow
}

# ----- 4) Render backend -----
$repoUrl = Ensure-Env "GITHUB_REPO_URL"
if (-not $repoUrl) {
  $remote = (git config --get remote.origin.url 2>$null) | Out-String
  $remote = $remote.Trim()
  if ($remote -match "git@github\.com:(.+?)\.git") { $repoUrl = "https://github.com/$($matches[1])" }
  elseif ($remote -match "https://github\.com/(.+?)(\.git)?$") { $repoUrl = "https://github.com/$($matches[1].TrimEnd('.git'))" }
}
if (-not $repoUrl) { $repoUrl = "https://github.com/rohinisd/Habit" }

Write-Host "Setting up Render backend ($AppName-api)..." -ForegroundColor Yellow
$ErrorActionPreference = "Continue"
& "$scriptDir\render-setup-backend.ps1" -ServiceName "$AppName-api" -RepoUrl $repoUrl -RootDir backend
$ErrorActionPreference = "Stop"
. "$scriptDir\load-env.ps1"

$backendUrl = & "$scriptDir\render-get-service-url.ps1" 2>$null
if (-not $backendUrl) {
  $backendUrl = "https://$AppName-api.onrender.com"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Render setup failed (repo not connected?). Continuing to Vercel. Connect repo at https://dashboard.render.com then re-run for backend." -ForegroundColor Yellow
  }
}

# ----- 5) Vercel frontend -----
$repoOwner = "rohinisd"; $repoName = "Library"
if ($repoUrl -match "github\.com/([^/]+)/([^/]+)") { $repoOwner = $matches[1]; $repoName = $matches[2] }
Write-Host "Ensuring Vercel project and env (link repo via API like Habit)..." -ForegroundColor Yellow
& "$scriptDir\vercel-create-project.ps1" -ProjectName $AppName -RepoOwner $repoOwner -RepoName $repoName -RootDirectory "frontend" 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "Vercel create/link failed; continuing with local deploy." -ForegroundColor Yellow; $LASTEXITCODE = 0 }
$env:API_BACKEND_URL = $backendUrl
$env:JWT_SECRET = Ensure-Env "JWT_SECRET"
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = "habit-jwt-secret-change-me-min-32-chars-long" }
Push-Location (Join-Path $root "frontend")
$vercelToken = Ensure-Env "VERCEL_TOKEN"
$ErrorActionPreference = "Continue"
try {
  $null = & npx vercel link --yes --project $AppName --token $vercelToken 2>&1
  $null = & npx vercel env add API_BACKEND_URL production --value $backendUrl --yes --token $vercelToken 2>&1
  $null = & npx vercel env add API_BACKEND_URL preview --value $backendUrl --yes --token $vercelToken 2>&1
  $null = & npx vercel env add JWT_SECRET production --value $env:JWT_SECRET --yes --token $vercelToken 2>&1
  $null = & npx vercel env add JWT_SECRET preview --value $env:JWT_SECRET --yes --token $vercelToken 2>&1
  Write-Host "Deploying frontend to Vercel..." -ForegroundColor Yellow
  $deployOut = & npx vercel deploy --prod --token $vercelToken --yes 2>&1 | Out-String
} finally {
  $ErrorActionPreference = "Stop"
  Pop-Location
}
$frontendUrl = "https://$AppName.vercel.app"
if ($deployOut -match 'https://[^\s"]+\.vercel\.app') { $frontendUrl = $matches[0].Trim() }

# ----- 6) Output -----
Write-Host ""
Write-Host "========== DEPLOY COMPLETE ==========" -ForegroundColor Green
Write-Host "Frontend:  $frontendUrl"
Write-Host "Backend:   $backendUrl"
Write-Host "Database:  Neon (DATABASE_URL in .env)"
Write-Host ""
Write-Host "Google OAuth: Add this in Google Cloud Console -> Credentials -> your OAuth client -> Authorized redirect URIs:" -ForegroundColor Yellow
Write-Host "  $backendUrl/api/auth/google/callback" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend may take 2-3 min on first deploy. Then open: $frontendUrl" -ForegroundColor Cyan
$LASTEXITCODE = 0
