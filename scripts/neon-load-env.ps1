# Load .env into process env for Neon scripts (NEON_API_KEY, NEON_PROJECT_ID, DATABASE_URL)
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envPath = Join-Path $root ".env"
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      $k = $matches[1].Trim(); $v = $matches[2].Trim()
      [Environment]::SetEnvironmentVariable($k, $v, 'Process')
    }
  }
}
