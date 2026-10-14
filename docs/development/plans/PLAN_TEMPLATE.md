---
id: PLAN-<OWNER>-<NNN>
owner: <OWNER token from tools/git-identity.*>
type: Major | Phase | Fix
status: Proposed
date: YYYY-MM-DD
supersedes: null
superseded_by: null
---

# <Title> (plan)

> Metadata is the frontmatter block above. `status` is one of Proposed, Agreed, Implemented,
> Superseded; dates are ISO (`YYYY-MM-DD`); an empty field is `null`, never a placeholder.
>
> ID scheme: `<KIND>-<OWNER>-<NNN>` — `OWNER` from `tools/git-identity.*` makes every record
> globally unique per creator. `NNN` is a per-owner sequence. Filename and `id` must match.
>
> Status moves the file: a record lives in `plans/<status>/` — `proposed/`, `agreed/`,
> `implemented/`, `superseded/` — and the move, the `status` field and the index are one
> operation: `sh tools/scaffold.sh records move <ID> Agreed` (RULES.md §Task-first workflow).
> The folder root holds only `PLAN_INDEX.md` and this template.

## Goal

[What this plan delivers and why. Reference the brief and progress sections when relevant.]

## Phases

[The delivery order, one row per phase — phases are shippable units, not work-breakdown tasks.
Exactly one row is bold: the phase in progress, or the next phase while none is in flight. Move
the emphasis when a phase closes; an Implemented or Superseded plan keeps its final phase bold.
`Gate` is the command or check that proves the phase done, not what it hopes to achieve.]

| Phase | Delivers | Gate |
| ----- | -------- | ---- |
| 1 | [what ships in phase 1] | [what proves phase 1 done] |
| **2** | **[what ships in phase 2 — the phase in progress]** | **[what proves phase 2 done]** |
| 3 | [what ships in phase 3] | [what proves phase 3 done] |

## Decisions

[Numbered decisions with rationale. These are binding once the user gives green.]

## Files

| File          | Change                           |
| ------------- | -------------------------------- |
| <path> | <NEW / modified — what changes> |

## Tests

[Test cases that prove the plan's decisions, one per line.]

## Validation

[Commands and manual checks. What proves the plan works, and what was not validated.]
