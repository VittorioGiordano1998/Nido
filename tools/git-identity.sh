#!/bin/sh
# Resolves the canonical OWNER token used in record IDs (RULES.md, Task-first workflow).
#
# Priority: `git config user.name` (normalized) -> current OS user (normalized).
# Normalization: uppercase, keep only [A-Z0-9] ("John Doe" -> "JOHNDOE").
#
# Usage:  sh tools/git-identity.sh
# Output: the OWNER token on stdout (single line).
git_name="$(git config user.name 2>/dev/null)"
os_user="$(id -un 2>/dev/null || whoami 2>/dev/null || echo "$USER")"
token="${git_name:-$os_user}"
normalized="$(printf '%s' "$token" | sed 's/[^[:alnum:]]//g' | tr '[:lower:]' '[:upper:]')"
echo "${normalized:-UNKNOWN}"
