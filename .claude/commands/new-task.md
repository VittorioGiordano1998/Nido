---
description: Create a task file from the task template
argument-hint: <Name>
---

# /new-task <Name>

Create a work item in `docs/development/tasks/proposed/TASK-<AREA>-<OWNER>-<NNN>-<slug>.md` from
`TASK_TEMPLATE.md`. Used at the start of any non-trivial work so the work is tracked before it
is executed.

## What to call

1. **Find before create** (RULES.md §Task-first workflow): call `records_search` (kinds:
   `["task"]`, query: the name) and check the result for an existing record covering the work,
   any owner. If one exists, claim it with `record_move` instead of creating a sibling.
2. Call `record_create` with `kind: "task"`, the title, `area` and `areaToken` (the `<AREA>`
   segment of the id — the abbreviation, which is why it is asked for rather than derived:
   `packages/vscode` is `VSC`), `type`, `severity`, and `sections` filled with `Task
   Description` and `Desired Outcome` (plus `Proposed Implementation` when known).
   `owner` is minted from the current git identity and must never be copied off a neighbouring
   record; pass it only to mint on someone else's behalf.
3. Working on the task means `record_move` to `In Progress` in the same commit as the first
   change.

## Output

`record_create` returns the minted record (`id`, `owner`, filename and path). The frontmatter
block is filled, the H1 is set to `# Task: <Name>`, the family's H2 sections are kept, the
first Touch History entry is written, and `TASK_INDEX.md` gains its row in the same call.

## Conventions

- The id, the filename and the owner token are minted by the tool, never hand-typed.
- Every later status change is `record_move` with the status and a Touch History `note` —
  moving the file, setting the field, appending the history entry and rewriting the index in
  one call.
- Follow the task-first workflow in `docs/agents/RULES.md`: create the task, execute it, and
  if it leaves unresolved problems behind, file a Known Issue with `/new-issue`.
- The indexes are generated, never hand-edited; a record written by hand instead needs
  `records_check` to confirm what it broke.