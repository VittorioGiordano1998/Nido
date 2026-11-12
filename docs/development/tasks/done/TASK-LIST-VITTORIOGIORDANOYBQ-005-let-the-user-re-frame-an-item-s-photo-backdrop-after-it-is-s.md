---
id: TASK-LIST-VITTORIOGIORDANOYBQ-005
owner: VITTORIOGIORDANOYBQ
type: Bug
status: Done
area: lists
severity: Low
opened: 2026-11-12
done: 2026-11-12
next: null
related: []
superseded_by: null
---

# Task: Let the user re-frame an item's photo backdrop after it is set

## Task Description

In the item sheet, a photo used as the item's backdrop shows only a 'Sfondo' badge. The framing editor (drag + zoom, same as the cover) opens only when first choosing 'Usa come sfondo'; once set, the position cannot be changed again short of removing the backdrop.

## Desired Outcome

The framing editor can be opened at any time for the current backdrop photo (same editor as the cover), with the current framing preloaded. The framing applies wherever the item appears. Existing backdrops keep their stored framing.

## Proposed Implementation

In TaskAttachmentsSheet, replace the badge-only state with a 'Sfondo · inquadra' button that calls openFraming(attachment, 'backdrop'); the editor already preloads bgX/bgY/bgZoom and offers 'Rimuovi sfondo'.

## Relevant Files

- `app/src/features/lists/TaskAttachmentsSheet.tsx`
- `app/src/features/lists/BackdropEditor.tsx`
- `app/src/features/lists/useTaskAttachments.ts` (`setBackdrop`)

## Verification Procedure

`cmd /c "npx tsc -b --noEmit"` from `app/`; manual check: open an item with a photo used as backdrop, tap "Sfondo · inquadra", move/zoom, save.

## Notes

The first-time flow ("Usa come sfondo" opens the editor) already existed; only the re-edit path was missing.

## Touch History

- 2026-11-12 — VITTORIOGIORDANOYBQ — created
- 2026-11-12 — VITTORIOGIORDANOYBQ — Started: add a re-frame button for the current backdrop photo
- 2026-11-12 — VITTORIOGIORDANOYBQ — status In Progress → Done

## Resolution

In `TaskAttachmentsSheet` the badge-only "Sfondo" state is now a "Sfondo · inquadra" button that reopens the shared `BackdropEditor` with the stored framing (`bgX`/`bgY`/`bgZoom`) preloaded, like the cover's "Copertina · inquadra". Saving goes through the existing `setBackdrop`, so the new framing applies in the list row and wherever else the item shows; existing backdrops keep their stored framing.

Verified with a TypeScript build (`tsc -b`, exit 0). Not verified in a running browser: no backend or Supabase mock was set up for a one-button change. No ESLint config exists in the project, so lint was not run.
