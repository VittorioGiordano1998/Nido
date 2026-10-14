<#
Resolves the canonical OWNER token used in record IDs (RULES.md, Task-first workflow).

Priority: `git config user.name` (normalized) -> current OS user (normalized).
Normalization: uppercase, keep only [A-Z0-9] ("John Doe" -> "JOHNDOE").

Usage:  powershell -ExecutionPolicy Bypass -File tools/git-identity.ps1
Output: the OWNER token on stdout (single line).
#>
$ErrorActionPreference = 'Stop'

$gitName = git config user.name 2>$null
$token = if ([string]::IsNullOrWhiteSpace($gitName)) { $env:USERNAME } else { $gitName }
$normalized = ($token -replace '[^A-Za-z0-9]', '').ToUpperInvariant()
if ([string]::IsNullOrWhiteSpace($normalized)) { $normalized = 'UNKNOWN' }

Write-Output $normalized
