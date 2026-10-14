<#
.SYNOPSIS
Scaffold bootstrap shim (Windows).

.DESCRIPTION
The implementation is `tools\scaffold.mjs` beside this file: it resolves the engine package
from the machine registry and the cache, or runs a local checkout when this is one, and never
clones. This shim keeps the documented `tools\scaffold.ps1 ...` command lines working.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File tools/scaffold.ps1 init --token Company=Acme --token Project=Widget

.EXAMPLE
powershell -ExecutionPolicy Bypass -File tools/scaffold.ps1 add <addon> --token Company=Acme
#>
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Rest = @()
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error 'scaffold: node is required'
}

& node (Join-Path $root 'tools\scaffold.mjs') @Rest
exit $LASTEXITCODE
