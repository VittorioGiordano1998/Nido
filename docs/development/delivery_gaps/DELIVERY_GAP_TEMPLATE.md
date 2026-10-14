---
id: DG-<OWNER>-<NNN>
owner: <OWNER token from tools/git-identity.*>
status: Planned
release_impact: <Blocker | n/a — risk | ...>
related: []
superseded_by: null
---

# Delivery Gap: <Title>

> Metadata is the frontmatter block above. `status` is one of Planned, Open, Closed; an empty
> field is `null` (or `[]` for a list), never a placeholder.
>
> ID scheme: `<KIND>-<OWNER>-<NNN>` — `OWNER` from `tools/git-identity.*` makes every record
> globally unique per creator. `NNN` is a per-owner sequence. Filename and `id` must match.
>
> Status moves the file: a record lives in `delivery_gaps/<status>/` — `planned/`, `open/`,
> `closed/` — and the move, the `status` field and the index are one operation:
> `sh tools/scaffold.sh records move <ID> Closed` (RULES.md §Task-first workflow). All
> subfolders stay covered by `DELIVERY_GAP_INDEX.md`.

## Description

[Describe the gap, why it exists, and what it currently prevents.]

## Notes

[Optional: related issues (link to KI-* files), dependencies, milestones, open questions.]
