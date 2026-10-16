---
id: TASK-BUCKET-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: bucket list
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented; SQL applied on the live project (probed 2026-10-16); the two-account check is the remaining owner step."
related: [TASK-MEMO-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Bucket list: experiences to do together with a linked memory

## Task Description

Owner request (2026-10-16): a shared bucket list of experiences ("cose da fare insieme"),
checkable, where completing an item can leave a memory (photo + caption + date) linked back
to it. Distinct from the wishlist (gifts) and the weekly plan (one proposal per week): this
is the long-lived list of things you want to do, with the journal entry attached when it
happens.

## Desired Outcome

- `/us/bucket` page: one-line add; open items listed in order; checking an item marks it
  done and stamps the date.
- Completing an item opens a compact sheet: "Come è andata?" with optional photo, caption
  and date (default today) → creates a memory linked to the item; "Segna senza ricordo"
  skips. The memory keeps the link.
- Done items show the date and, when linked, a small photo thumbnail + caption; a "Ricordi"
  link opens the journal.
- Unchecking clears the done state; an already-created memory and its link stay (a memory
  is a fact that happened).
- Realtime for both partners; `npm run build` + `npm run lint` green; migration +
  `apply-bucket.sql`; two-account pass by the owner.

## Proposed Implementation

- Migration `20261016170000_nido_bucket_items.sql` (+ `apply-bucket.sql`, `apply-all.sql`):
  `bucket_items` (id, couple_id, title, note, done_at, position, created_by, created_at,
  updated_at; couple/position index); RLS couple members all; `set_updated_at` trigger;
  Realtime publication.
- `memories.bucket_item_id` (see the memories migration) carries the link; the UI reads it
  through `useMemories`.
- `app/src/features/bucket/useBucket.ts` (state layer): list, `addItem`, `toggleItem`
  (done_at), `deleteItem`, `restoreItem` (for the undo toast, TASK-UI-…-001).
- `app/src/features/bucket/BucketPage.tsx` (View) + the completion sheet; the memory form
  is shared with `MemoriesPage`.
- Noi hub entry ("Bucket list").

## Relevant Files

- `app/src/features/notes/NoteEditor.tsx` — bottom-sheet pattern.
- `app/src/features/lists/ListView.tsx` — check-item interaction.
- TASK-MEMO-VITTORIOGIORDANOYBQ-001 — the journal this links to.

## Verification Procedure

- Two-account: add/check/uncheck an item → live on both sides; completion with photo →
  the memory appears in Ricordi with the bucket badge; skip → no memory.
- Delete an item → gone on both; undo restores it.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- Order is manual by `position` (new items at the end), like lists.
- Owner step: paste `apply-bucket.sql` and `apply-memories.sql` (order matters:
  `apply-bucket.sql` first), then the two-account pass.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented (with TASK-MEMO-…-001, one batch): migration `20261016170000_nido_bucket_items.sql` (title, note, done_at, position, couple RLS, updated_at trigger, Realtime) with `apply-bucket.sql` and `apply-all.sql`; `useBucket` (add, toggle, delete, restore, open/done split), `BucketPage` (one-line add, check-off flow, done date, linked-memory thumbnail linking to Ricordi, trash with undo), `BucketDoneSheet` (solo spunta / ricordo) and the shared `MemoryEditor` creating the linked memory; route `/us/bucket` and the Noi hub tile.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
