#!/usr/bin/env sh
# Links .opencode/{agents,commands} to .claude/{agents,commands}.
#
# Agent and command definitions live once, in .claude/. Claude Code reads them there;
# opencode only scans .opencode/, so we point it at the same files with a symlink.
# Skills need no link — opencode already reads .claude/skills/ directly.
#
# Run once per clone:
#   sh tools/link-agent-config.sh
#
# On Windows use tools/link-agent-config.ps1 instead (junctions, no admin needed).

set -eu

repo=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

for name in agents commands; do
    link="$repo/.opencode/$name"
    target="$repo/.claude/$name"

    [ -d "$target" ] || { echo "Missing source directory: $target" >&2; exit 1; }

    if [ -L "$link" ]; then
        echo "ok    .opencode/$name -> .claude/$name (already linked)"
        continue
    fi

    if [ -e "$link" ]; then
        echo ".opencode/$name exists and is a real directory. Delete it first, then re-run." >&2
        exit 1
    fi

    ln -s "../.claude/$name" "$link"
    echo "link  .opencode/$name -> .claude/$name"
done
