---
id: TASK-NOTE-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: notes
severity: Medium
opened: 2026-10-14
done: 2026-10-15
next: null
related: [PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Notes: shared notes with realtime editing

## Task Description

M1 / Fase 1.3. A small shared notebook: one-off notes ("codice del cancello", "idee per il
weekend") with title and body, visible to both, edited live. The `notes` table, RLS and
realtime publication exist since M0; the page is not there yet.

Impact: lowest-effort M1 feature and the natural test bed for the realtime editing pattern
that the Fase 2 features reuse.

## Desired Outcome

- `/notes`: notes ordered by `updated_at` (newest first) with a preview; "new note".
- Editor: title + body (plain textarea), save, delete; the list updates its preview and order.
- Partner edits appear without a manual refresh; last write wins is acceptable and documented.
- `npm run build` + `npm run lint` green; two-profile check.

## Proposed Implementation

- `app/src/features/notes/useNotes.ts` (NEW) — state layer: load, create, update, delete,
  Realtime subscription filtered by `couple_id`.
- `app/src/features/notes/NotesPage.tsx` (rewrite) — master-detail on one route: list on top,
  open editor inline (no nested route for the MVP).
- `app/src/features/notes/NoteEditor.tsx` (NEW) — the form panel.
- `app/src/ui/icons.tsx` — `PlusIcon`, `TrashIcon` if missing.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `notes` DDL.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — `notes_*` policies.
- `app/src/features/lists/useLists.ts` — sibling pattern (whichever lands first).

## Verification Procedure

- Two browser profiles: write a note on one side → it appears on the other without refresh;
  edit it on both sides → last write wins; delete → disappears on both.
- `cd app && npm run build` and `npm run lint`.

## Notes

- Plain text only; rich text and `pinned_to_widget` stay for M4 (home widget).
- Concurrent edit policy: last write wins for the MVP; the record documents it so nobody
  mistakes it for conflict resolution.

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-14 — status Proposed → In Progress
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — implemented `useNotes` (load ordered by
  `updated_at`, create/update/delete, Realtime), `NotesPage` + `NoteEditor` (title, body,
  delete, Esc/backdrop close), route `/notes`, shared `notePreview` helper, Home entry
  point on the latest note. Verified: `npm run build` + `npm run lint` green.
- 2026-10-15 — VITTORIOGIORDANOYBQ — Owner verification passed on the live app (two-account pass, 2026-10-15); closed in the phase close-out.

## Resolution

Implemented: notes index + editor, Realtime on `notes`, last write wins. Owner two-account check on 2026-10-15.
