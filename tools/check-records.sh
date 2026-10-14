#!/usr/bin/env sh
# Verifies the record registry stays consistent (RULES.md §Task-first workflow).
#
# This is a shim: the checks live in `@scaffold/records` and run as `scaffold records check`
# (PLAN-PIETRORUSSO-002 decision D5). The script survives because the CI `records` job, the
# terminal and every already-adopted project call it by this name, and because a check that
# is only reachable from an editor is a check CI cannot run.
#
#   sh tools/check-records.sh          # what the CI `records` job runs
#
# What it checks, for tasks / known issues / delivery gaps / plans / ADRs:
#   1. every record's filename starts with its `id`, and the id uses the owner-qualified scheme
#   2. no duplicate ids across the registry
#   3. every record's status matches the subfolder it sits in
#   4. required fields are filled and dates are ISO
#   5. every `*_INDEX.md` this tool generates is exactly what a regeneration would write —
#      which subsumes "every record is linked from its index" and catches the drift a
#      hand-maintained index accumulates
#   6. snippets are linked from `SNIPPETS_INDEX.md`, and every other `*_INDEX.md` still
#      carries a table (an empty state is an empty table, never prose)
#
# Repair: `sh tools/scaffold.sh records sync` rewrites the indexes; `records migrate` converts
# a project that still uses the old `- **ID:**` header.
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

command -v node >/dev/null 2>&1 || {
    echo "check-records: node is required (the checks run in @scaffold/records)" >&2
    echo "check-records: in CI, use an image with node — the records job needs it" >&2
    exit 1
}

# A checkout of the template drives its own engine, with no clone and no network: that is what
# lets this repository's CI run the check offline. A scaffolded project has no engine of its
# own, so it goes through the bootstrap, which resolves the recorded source and its cache.
if [ -f "$ROOT/packages/engine/bin/scaffold.mjs" ]; then
    exec node "$ROOT/packages/engine/bin/scaffold.mjs" records check --target "$ROOT"
fi

exec sh "$ROOT/tools/scaffold.sh" records check --target "$ROOT"
