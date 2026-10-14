---
description: Create a delivery-gap file from the gap template
argument-hint: <Title>
---

# /new-dg <Title>

Create a delivery-gap record in `docs/development/delivery_gaps/planned/DG-<OWNER>-<NNN>-<slug>.md`
(or `delivery_gaps/open/`) from `DELIVERY_GAP_TEMPLATE.md`. Use it for gaps that are not defects
in a completed feature but currently prevent release or make defects easier to ship unnoticed
(missing milestone work, missing CI, missing configuration, etc.).

## What to call

1. **Find before create** (RULES.md §Task-first workflow): call `records_search` (kinds:
   `["delivery_gap"]`, query: the title) and check the result for an existing gap covering
   the work, any owner, before creating.
2. Call `record_create` with `kind: "delivery_gap"`, the title, `release_impact` and
   `sections` filled with `Description` and `Notes`. `status` defaults to `Planned`, which is
   where scheduled milestone work belongs; pass `status: "Open"` for a gap that is already
   open. `owner` is minted from the current git identity.

## Output

`record_create` returns the minted record (`id`, `owner`, filename and path). The frontmatter
block is filled, the H1 is set to `# Delivery Gap: <Title>`, and `DELIVERY_GAP_INDEX.md`
gains its row in the same call.

## Conventions

- The id, the filename and the owner token are minted by the tool, never hand-typed: the
  owner is the *current* git identity, never the one copied off a neighbouring record.
- When the gap relates to specific defects, mention the `KI-<OWNER>-<NNN>.md` files in
  `Notes`; the corresponding KIs link back to this gap from their own `Notes`.
- Gaps that derive from audit findings rather than a specific defect carry a
  "No related KI" note.
- Closing the gap is `record_close`, which moves the file and rewrites the index.