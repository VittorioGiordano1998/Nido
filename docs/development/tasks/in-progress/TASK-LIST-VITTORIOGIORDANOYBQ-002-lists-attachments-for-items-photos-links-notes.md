---
id: TASK-LIST-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: lists
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented (task_attachments photo/link/note, sheet, previews, realtime, bucket); owner step: paste apply-list-attachments.sql, then the two-account check."
related: [TASK-LIST-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Lists: attachments for items (photos, links, notes)

## Task Description

Owner request (2026-10-16): attach photos, links and other things to lists. The owner chose
**multiple attachments per item**, with captions. Today an item is title + check only:
`tasks.note` exists in the schema but no editor surfaces it, and there is nowhere to put a
photo or a link.

## Desired Outcome

- Every list item can carry many attachments: photos (Supabase Storage, private bucket),
  links (URL) and notes (free text), each with an optional caption.
- List detail shows a preview under the item (photo thumbnails, link chips, note line) and
  an "Allegati" sheet per item to add/remove; tapping opens the photo signed URL or the
  link in a new tab.
- Photos are capped client-side (image types, 5 MB); photo objects are removed when their
  attachment, item or list is deleted (best effort).
- Partner changes arrive live (Realtime on `task_attachments`); RLS keeps attachments
  couple-scoped and the bucket serves only couple members through signed URLs.
- `npm run build` + `npm run lint` green.

## Proposed Implementation

- Migration `20261016120000_nido_task_attachments.sql` (+ `apply-list-attachments.sql`):
  `task_attachments` (`task_id`, `couple_id`, `kind` photo|link|note, `value`, `caption`,
  `created_by`), couple RLS mirroring `tasks`, Realtime + replica identity, private bucket
  `list-photos` with the four couple-scoped storage policies.
- `app/src/features/lists/useTaskAttachments.ts` (new) — load by couple, Realtime,
  add/delete, photo upload (`{couple_id}/{uuid}.{ext}`), signed-URL map, best-effort
  storage cleanup helpers.
- `app/src/features/lists/TaskAttachmentsSheet.tsx` (new) — bottom sheet per item: current
  attachments plus add controls (photo picker with caption, link URL with caption, note).
- `app/src/features/lists/ListView.tsx` — paperclip button and previews under the item,
  cleanup on delete item/list, sheet state.
- `app/src/ui/icons.tsx` — `PaperclipIcon`, `ImageIcon`, `LinkIcon`.

## Relevant Files

- `docs/development/tasks/done/TASK-LIST-VITTORIOGIORDANOYBQ-001-lists-shared-lists-with-check-items-and-assignment.md` — the lists this extends.
- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `task_lists`, `tasks` DDL.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — table and storage policies to mirror.
- `app/src/features/lists/**`, `app/src/ui/components.tsx`, `app/src/ui/icons.tsx`.

## Verification Procedure

- Two-account: add a photo, a link and a note on one side → they appear on the other
  without refresh; delete → gone; URL probe with the anon key returns no rows and the
  bucket object is not publicly reachable.
- Size/type rejection message; cleanup when deleting the item.
- `cd app && npm run build && npm run lint`.

## Notes

- `reset_couple_data` clears attachment rows through the `task_lists` cascade; storage
  objects are not swept by the SQL reset (accepted limitation, noted in the resolution).
- Photo display uses short-lived signed URLs refreshed on load; nothing is public.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; implementing item attachments (photos, links, notes) in this session.
- 2026-10-16 - status Proposed → In Progress
- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261016120000_nido_task_attachments.sql` (`task_attachments` + couple RLS + Realtime + private bucket `list-photos` + storage policies) with apply script and `apply-all.sql`; `useTaskAttachments` (load/Realtime/add/delete, photo upload with a 5 MB image cap, signed-URL map, best-effort storage cleanup), `TaskAttachmentsSheet` (Foto/Link/Nota tabs, captions), `ListView` previews + paperclip button + cleanup on item/list delete, new Paperclip/Image/Link icons. `npm run build` + `npm run lint` green; the live project probe shows the table is not applied yet (owner step).

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
