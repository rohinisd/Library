# Load .env for Fly scripts (FLY_API_TOKEN, FLY_APP_NAME)
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
