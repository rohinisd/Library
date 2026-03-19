# Load .env for Render scripts (RENDER_API_KEY, RENDER_SERVICE_ID)
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
