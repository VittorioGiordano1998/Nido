---
id: TASK-MEMO-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: memories
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented; SQL applied on the live project (probed 2026-10-16); the two-account check is the remaining owner step."
related: [TASK-BUCKET-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Memories: photo timeline with captions and year filter

## Task Description

Owner request (2026-10-16): "Ricordi" — a photo journal: photo + caption + date, shown as
a polaroid-style grid, filterable by year. Reuses the existing photo pipeline (client-side
downscale, couple-scoped private bucket, signed URLs) like list covers and avatars.
Distinct from capsules (sealed text that opens on a chosen day) and from the yearly recap
VITTORIOGIORDANOYBQ-002-recap (statistics): this is the visual diary.

## Desired Outcome

- `/us/memories` page: 2-column polaroid grid ordered by date desc; each card is a light
  frame with the photo, caption and date, with a small static tilt for the polaroid feel.
- Year filter chips (Tutti + the years actually present in the data).
- "Aggiungi ricordo" sheet: photo (required), caption (optional), date (default today);
  uploads downscaled client-side; the new card appears live for the partner too.
- Tapping a memory opens a detail sheet: larger photo, caption, date, author; delete from
  there (with the undo toast once TASK-UI-…-001 lands); a "dalla bucket list" badge when
  the memory is linked to a bucket item.
- Empty state with illustration + CTA; `npm run build` + `npm run lint` green; migration +
  `apply-memories.sql`; two-account pass by the owner.

## Proposed Implementation

- Migration `20261016180000_nido_memories.sql` (+ `apply-memories.sql`, `apply-all.sql`):
  `memories` (id, couple_id, photo_path text not null, caption, taken_on date not null,
  created_by, created_at, bucket_item_id uuid references bucket_items(id) on delete set
  null; couple/taken_on index); RLS couple members all; Realtime publication; new private
  `memories` storage bucket with the standard couple-scoped object policies.
- `app/src/features/memories/useMemories.ts` (state layer): list with signed URLs,
  `createMemory` (upload + insert), `deleteMemory` (also removes the object when
  unreferenced), `restoreMemory` (undo toast); realtime channel.
- `app/src/features/memories/MemoriesPage.tsx`, `MemoryEditor.tsx` (form sheet, shared with
  the bucket completion flow), `MemoryCard.tsx` (polaroid), bucket-badge helper.
- Router route + Noi hub entry; year grouping via `core/dates`.

## Relevant Files

- `app/src/core/photos.ts` — downscale/upload/signed-URL helpers.
- `app/src/features/lists/usePhotoUrls.ts` — signed URL state pattern.
- `app/src/features/capsules/CapsulesPage.tsx` — sheet + list page pattern.
- TASK-BUCKET-VITTORIOGIORDANOYBQ-001 — the linked list.

## Verification Procedure

- Two-account: add a memory → live on the partner's page; year filter; delete → gone for
  both, undo restores; bucket-linked memory shows the badge.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- Migration order: `apply-bucket.sql` before `apply-memories.sql` (the FK).
- Photos stay in a private bucket; the partner reads them through the couple-scoped policy.
- Owner step: paste the two SQL files, then the two-account pass.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261016180000_nido_memories.sql` (`memories` with `bucket_item_id` FK to `bucket_items`, couple RLS, Realtime, private `memories` bucket with the couple-scoped object policies) with `apply-memories.sql` and `apply-all.sql`; `features/memories/photos.ts` (upload + "remove if unused" + signed URLs), `useMemories` (list, create, delete with restore + `purgePhoto`, realtime), `MemoryEditor` (shared with the bucket flow), `MemoryCard` polaroid grid with per-card tilt, `MemoryDetail` (delete), `MemoriesPage` (year filter chips, illustrated empty state, success toast), route `/us/memories` and the Noi hub tile.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
