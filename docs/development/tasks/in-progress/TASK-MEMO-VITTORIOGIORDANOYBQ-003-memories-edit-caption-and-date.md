---
id: TASK-MEMO-VITTORIOGIORDANOYBQ-003
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: memories
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; a manual edit pass is the remaining check."
related: [TASK-MEMO-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Memories: edit caption and date

## Task Description

A memory can only be created or deleted: a wrong caption or date means delete and re-upload (which also loses the bucket-list link). Owner request (2026-10-16): edit caption and date.

## Desired Outcome

- From the detail sheet, «Modifica» opens the editor prefilled (caption, date); the photo stays untouched.
- Saving updates the row (and the grid ordering if the date moved) and shows the success toast.
- The delete flow stays as is.

## Proposed Implementation

- `useMemories`: `updateMemory(id, { caption, takenOn })` (update + upsert local).
- `MemoryEditor`: an `initial` prop (memory) switching labels ("Modifica ricordo", photo section read-only with a note).
- `MemoryDetail`: «Modifica» button wiring the editor.

## Relevant Files

- `app/src/features/memories/MemoryEditor.tsx`, `MemoryDetail.tsx`, `MemoriesPage.tsx`, `useMemories.ts`.

## Verification Procedure

- Edit caption/date → both partners see the change (Realtime); moving the date re-sorts the grid and the year filter; the bucket link survives.
- `npm run build` + `npm run lint` green.

## Notes

- The photo is not replaceable in v1: replacing means delete/re-upload (noted as possible follow-up).

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `useMemories.updateMemory` (caption+date, upsert local), `MemoryEditor` gained the edit mode (title, photo read-only with the signed URL, prefilled fields, `MemoryEditorInput.file` null) and `MemoryDetail` the «Modifica» button; the bucket completion flow uses the same input contract.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
