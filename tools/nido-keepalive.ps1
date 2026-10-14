# Nido - Supabase keep-alive (external safety net)
#
# Primary keep-alive lives INSIDE Supabase: the pg_cron job "nido-heartbeat"
# (see supabase/migrations/..._nido_keepalive.sql) writes a real transaction
# every day, which is what keeps a free-tier project out of the pausing window.
#
# This script is the external safety net: it calls the same heartbeat through
# POST /rest/v1/rpc/keepalive_ping with the anon key (an UPDATE - connections
# and plain reads alone are not enough). It runs as the Windows scheduled task
# "Nido Supabase keep-alive" (daily, catch-up enabled). Remove it with:
#   Unregister-ScheduledTask -TaskName 'Nido Supabase keep-alive'
#
# Connection values come from app/.env.local (single source of truth).
# One line per run in %LOCALAPPDATA%\Nido\keepalive.log.

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repoRoot 'app\.env.local'
$logDir = Join-Path $env:LOCALAPPDATA 'Nido'
$logFile = Join-Path $logDir 'keepalive.log'

function Get-EnvValue([string]$name) {
  $line = Get-Content $envFile | Where-Object { $_ -match "^$name=(.+)$" } | Select-Object -First 1
  if (-not $line) { throw "Missing $name in $envFile" }
  return ($line -replace "^$name=", '').Trim()
}

$stamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

try {
  $base = Get-EnvValue 'VITE_SUPABASE_URL'
  $key = Get-EnvValue 'VITE_SUPABASE_ANON_KEY'
  $ping = Invoke-RestMethod -Method Post -Uri "$base/rest/v1/rpc/keepalive_ping" `
    -Headers @{ apikey = $key } -ContentType 'application/json' -Body '{}' -TimeoutSec 30
  $line = "$stamp OK ping=$ping"
} catch {
  $status = $null
  if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
  $line = "$stamp FAIL status=$status $($_.Exception.Message)"
}

Add-Content -Path $logFile -Value $line

# keep the log small: past ~200 KB, keep only the last 300 lines
if ((Get-Item $logFile).Length -gt 204800) {
  $tail = Get-Content $logFile -Tail 300
  Set-Content -Path $logFile -Value $tail
}

Write-Output $line
