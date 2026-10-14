---
description: Create a known-issue file from the issue template
argument-hint: <Title>
---

# /new-issue <Title>

Create a defect record in `docs/development/known_issues/open/KI-<OWNER>-<NNN>-<slug>.md` from
`KNOWN_ISSUE_TEMPLATE.md`. File it when a problem is observed or confirmed and no tracked issue
covers it yet.

## What to call

1. **Find before create** (RULES.md §Task-first workflow): call `records_search` (kinds:
   `["known_issue"]`, query: the title) and check the result for an existing issue covering
   the defect, any owner, before creating.
2. Call `record_create` with `kind: "known_issue"`, the title, `area`, `severity`, `related`
   (the `TASK-…`/`DG-…` ids the issue came out of) and `sections` filled with `Symptom`,
   `Root cause`, `Fix direction` and `Notes`. `owner` is minted from the current git identity;
   pass it only to mint on someone else's behalf.

## Output

`record_create` returns the minted record (`id`, `owner`, filename and path). The frontmatter
block is filled, the H1 is set to `# Known Issue: <Title>`, and `KNOWN_ISSUE_INDEX.md` gains
its row in the same call.

## Conventions

- The id, the filename and the owner token are minted by the tool, never hand-typed: the
  owner is the *current* git identity, never the one copied off a neighbouring record.
- When the defect relates to a delivery gap, add the `DG-<OWNER>-<NNN>` id to `related` in
  the call.
- Closing the issue is `record_close` (or `record_move` with `Won't Fix` for a declined one),
  which moves the file and rewrites the index.
- The indexes are generated, never hand-edited; `record_create` writes this one's row.