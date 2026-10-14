#!/usr/bin/env sh
# Scaffold bootstrap shim (macOS / Linux / Git Bash).
#
# The implementation is `tools/scaffold.mjs` beside this file: it resolves the engine package
# from the machine registry and the cache, or runs a local checkout when this is one, and never
# clones. This shim keeps the documented `sh tools/scaffold.sh ...` command lines working.
#
#   sh tools/scaffold.sh init --token Company=Acme --token Project=Widget
#   sh tools/scaffold.sh add <addon> --token Company=Acme
#   sh tools/scaffold.sh status
#   sh tools/scaffold.sh cache add <package.tgz>
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

command -v node >/dev/null 2>&1 || { echo "scaffold: node is required" >&2; exit 1; }

exec node "$ROOT/tools/scaffold.mjs" "$@"
