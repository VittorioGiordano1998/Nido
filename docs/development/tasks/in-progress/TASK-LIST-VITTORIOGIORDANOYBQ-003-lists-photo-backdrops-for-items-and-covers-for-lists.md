---
id: TASK-LIST-VITTORIOGIORDANOYBQ-003
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: lists
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented (uniform photo cards with stored framing, item sheet with backdrop/cover actions, list cover upload/change/remove, client-side downscale); owner step: paste apply-list-backdrops.sql, then the two-account check."
related: [TASK-LIST-VITTORIOGIORDANOYBQ-002, PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Lists: photo backdrops for items and covers for lists

## Task Description

Owner request (2026-10-16, refinements agreed in the same session): a photo attached to an
item can become the backdrop of its card, and a list can carry its own cover photo. The
backdrop photo is picked by hand among the item's photos and its framing (position + zoom,
"the centre I want") is stored per photo. Decisions taken with the owner:

- backdrops on items **and** a cover for the list (upload from the list page included);
- every item card keeps the **same taller height** (with or without a photo);
- no thumbnails on the row: tapping the row opens the item sheet with everything (photos,
  links, notes);
- the row keeps its quick actions: check, assignee, **bell, trash**.

Impact: `task_attachments` (TASK-LIST-...-002) gains the backdrop choice and framing;
`task_lists` gains the cover. Both tables already sync over Realtime, so the partner sees
everything live. No RLS change.

## Desired Outcome

- Item rows are uniform taller cards (~96 px): photo backdrop with a dark scrim when set,
  plain surface otherwise; title and the quick actions stay readable in both themes; done
  items dim their photo. Tapping the row (not a button) opens the item sheet.
- The item sheet lists photos, links and notes; each photo can be set as the item's
  backdrop (one per item) or as the list cover, opening a framing editor (drag to move,
  slider to zoom, live preview); deleting the backdrop photo simply clears the backdrop.
- List cards in the index and the list page header show the cover with the same treatment;
  the cover can be uploaded from the list page, changed and removed; removing a cover that
  is also an item photo never breaks the item (only the fields clear).
- Photos are downscaled client-side before upload (max 1600 px, JPEG) so backdrops stay
  light and zooming keeps quality.
- `npm run build` + `npm run lint` green; two-account flows verified by the owner.

## Proposed Implementation

- Migration `20261016130000_nido_list_photo_backdrops.sql` (+ `apply-list-backdrops.sql`,
  `apply-all.sql`): `task_attachments.is_backdrop` (partial unique per task) + `bg_x/bg_y/
  bg_zoom`; `task_lists.cover_path/cover_x/cover_y/cover_zoom`; range checks. No policy or
  publication changes.
- `app/src/features/lists/photos.ts` (new): client-side downscale and storage helpers
  shared by attachments and covers.
- `useTaskAttachments`: new columns, `setBackdrop` / `updateBackdropFraming` /
  `clearBackdrop`; attachment deletion releases any cover using the same path.
- `useLists`: cover columns and `setCover` / `clearCover` / `releaseCoversForPath`; cover
  upload.
- Views: `BackdropPhoto` (shared photo layer + scrim), `BackdropEditor` (framing modal),
  `TaskAttachmentsSheet` (photo actions + badges), `ListView` (uniform rows, row tap,
  cover header), `ListsPage` (cover on the cards).

## Relevant Files

- `docs/development/tasks/done/TASK-LIST-VITTORIOGIORDANOYBQ-002-lists-attachments-for-items-photos-links-notes.md` — the attachments this extends.
- `supabase/migrations/20261016120000_nido_task_attachments.sql` — the table being extended.
- `app/src/features/lists/**` — hooks and views.
- `app/src/ui/icons.tsx`, `app/src/ui/components.tsx`.

## Verification Procedure

- Two-account: set a backdrop and a cover on one side → the other sees them live; change
  framing → live; delete the photo → backdrop/cover clear without breaking the item.
- Row tap opens the sheet; the quick buttons still work and do not open it.
- Upload a big photo → stored file is downscaled; cover upload/change/remove flows.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- Framing: `object-position` (0-100 %) + `scale` (1-3); the editor and the cards share the
  same component, so the preview is WYSIWYG.
- Cover paths may also be item photos (set from the sheet): the client clears the cover
  fields when the photo is deleted instead of deleting the object from under the item.
- Owner step: paste `apply-list-backdrops.sql`, then the two-account check.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; implementing backdrops, covers and the framing editor in this session.
- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261016130000_nido_list_photo_backdrops.sql` (`task_attachments.is_backdrop` + partial unique + `bg_x/bg_y/bg_zoom`; `task_lists.cover_path/cover_x/cover_y/cover_zoom`; range checks) with `apply-list-backdrops.sql` and `apply-all.sql`; `photos.ts` (client-side downscale to 1600 px, shared upload, "remove if unused", 24 h signed URLs), `usePhotoUrls`, `BackdropPhoto` + `BackdropEditor` (drag + zoom with live preview), `useTaskAttachments` (`setBackdrop`/`clearBackdrop`, deletion keeps referenced covers), `useLists` (cover upload/set/clear, `releaseCoversForPath`), uniform 96 px item cards with backdrop and row-tap sheet, cover banner and "Aggiungi copertina" on the list page, covers on the lists index. `npm run build` + `npm run lint` green; the two-account check is the owner step.
- 2026-10-16 — status Proposed → In Progress

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
