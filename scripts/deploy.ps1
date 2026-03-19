# Deploy to Vercel (production). Uses VERCEL_TOKEN from env or .env.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not $env:VERCEL_TOKEN) {
    if (Test-Path ".env") {
        Get-Content ".env" | ForEach-Object {
            if ($_ -match '^\s*([^#=]+)=(.*)$') {
                $k = $matches[1].Trim(); $v = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($k, $v, 'Process')
            }
        }
    }
}

if (-not $env:VERCEL_TOKEN) {
    Write-Error "VERCEL_TOKEN is not set. Add it to .env or Cursor environment variables. See VERCEL_SETUP.md"
    exit 1
}

npx vercel deploy --prod --token=$env:VERCEL_TOKEN --yes
