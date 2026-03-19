# List Vercel projects. Usage: .\vercel-list-projects.ps1
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\load-env.ps1"
if (-not $env:VERCEL_TOKEN) { Write-Error "VERCEL_TOKEN not set"; exit 1 }
$headers = @{ "Authorization" = "Bearer $env:VERCEL_TOKEN"; "Accept" = "application/json" }
$uri = "https://api.vercel.com/v9/projects?limit=20"
if ($env:VERCEL_TEAM_ID) { $uri += "&teamId=$env:VERCEL_TEAM_ID" }
$r = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
$projects = if ($r.projects) { $r.projects } else { $r }
foreach ($p in $projects) {
  $name = $p.name
  $link = if ($p.link) { $p.link.repo } else { "(none)" }
  Write-Host $name -NoNewline; Write-Host " | link: " -NoNewline; Write-Host $link
}
