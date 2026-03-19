# Run FastAPI backend locally. Loads .env from repo root. Requires: pip install -r requirements.txt
$ErrorActionPreference = "Stop"
$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $backendDir
$envPath = Join-Path $root ".env"
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process') }
  }
}
if (-not $env:DATABASE_URL) { Write-Error "DATABASE_URL not set in $envPath"; exit 1 }
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = "habit-jwt-secret-change-me-min-32-chars-long" }
Set-Location $backendDir
Write-Host "Starting backend at http://localhost:10000 (docs: http://localhost:10000/docs)" -ForegroundColor Cyan
# Prefer Python 3.12 if available (uvicorn often installed there); fallback to python
$usePy312 = $false
if (Get-Command py -ErrorAction SilentlyContinue) {
  & py -3.12 -c "exit(0)" 2>$null
  if ($LASTEXITCODE -eq 0) { $usePy312 = $true }
}
if ($usePy312) { py -3.12 -m uvicorn main:app --reload --host 0.0.0.0 --port 10000 }
else { python -m uvicorn main:app --reload --host 0.0.0.0 --port 10000 }
