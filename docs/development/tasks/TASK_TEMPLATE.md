---
id: TASK-<AREA>-<OWNER>-<NNN>
owner: <OWNER token from tools/git-identity.*>
type: Chore | Feature | Fix | Docs | Style | Refactor | Test
status: Proposed
area: <layer / subsystem>
severity: Critical | High | Medium | Low
opened: YYYY-MM-DD
done: null
next: <single line: the live state a new owner reads first — updated on every touch/handoff>
related: []
superseded_by: null
---

# Task: <Name>

> Metadata is the frontmatter block above — one parser for the UI, the CLI, CI and agents.
> `status` is one of Proposed, Ready, In Progress, Blocked, Done, Cancelled; dates are ISO
> (`YYYY-MM-DD`); `related` and `superseded_by` hold record IDs; an empty field is `null`
> (or `[]` for a list), never a placeholder.
>
> ID scheme: `<KIND>-<AREA>-<OWNER>-<NNN>` with `OWNER` from `tools/git-identity.*` makes every
> record globally unique per creator (two people can never mint the same ID). `NNN` is a
> per-(area, owner) sequence. Filename and `id` must match.
>
> Status moves the file: a record lives in `tasks/<status>/` — `proposed/`, `ready/`,
> `in-progress/`, `blocked/`, `done/`, `cancelled/` — and the move, the `status` field, the
> Touch History entry and the index are one operation:
> `sh tools/scaffold.sh records move <ID> "<Status>"` (RULES.md §Task-first workflow). The
> folder root holds only `TASK_INDEX.md` and this template.

## Task Description

[Describe the problem to solve and its impact.]

## Desired Outcome

[Describe what would be the desired condition after task is complete.]

## Proposed Implementation

[Detailed implementation proposal, with list of files to create/modify/delete.]

## Relevant Files

[List of files to read in order to acquire context.]

## Verification Procedure

[Describe how the task result is verified: tests to run, commands, manual checks.]

## Notes

[Optional constraints, dependencies, references or risks.]

## Touch History

[Actions performed on task (creation, updates to this file, attempts of execution, resolution...):

- who touched this task (if is an agent: agent model name/provider/thinking-effort)
- when
- what has been done

]

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
