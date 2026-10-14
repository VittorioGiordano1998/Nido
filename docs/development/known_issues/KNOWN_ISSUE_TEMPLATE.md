---
id: KI-<OWNER>-<NNN>
owner: <OWNER token from tools/git-identity.*>
status: Open
area: <layer / subsystem>
severity: Critical | High | Medium | Low
opened: YYYY-MM-DD
fixed: null
related: []
superseded_by: null
---

# Known Issue: <Title>

> Metadata is the frontmatter block above. `status` is one of Open, Fixed, Won't Fix; dates
> are ISO (`YYYY-MM-DD`); an empty field is `null` (or `[]` for a list), never a placeholder.
>
> ID scheme: `<KIND>-<OWNER>-<NNN>` — `OWNER` from `tools/git-identity.*` makes every record
> globally unique per creator. `NNN` is a per-owner sequence. Filename and `id` must match.
>
> Status moves the file: a record lives in `known_issues/<status>/` — `open/`, `fixed/`,
> `wont-fix/` — and the move, the `status` field and the index are one operation:
> `sh tools/scaffold.sh records move <ID> Fixed` (RULES.md §Task-first workflow). All
> subfolders stay covered by `KNOWN_ISSUE_INDEX.md`.

## Symptom

[What happens, from the user's perspective. Include reproduction steps when known.]

## Root cause

[Where the defect comes from, with file:line references when known.]

## Attempted fixes

[Optional: fixes tried that did not resolve the issue, and why.]

## Fix direction

[For open issues: how the problem is intended to be fixed.]

## Fix

[For fixed issues: what was changed and how it was verified.]

## Notes

[Optional: related issues, affected areas, references, open questions.]
