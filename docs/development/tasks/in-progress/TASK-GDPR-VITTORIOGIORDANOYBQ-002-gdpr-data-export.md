---
id: TASK-GDPR-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: gdpr
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented; an export of a populated account is the remaining owner check."
related: [TASK-GDPR-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: GDPR: data export

## Task Description

Account deletion exists but there is no export: the data-portability half of GDPR is missing, and there is no backup before the E2E vault. Owner request (2026-10-16): download everything from Profile.

## Desired Outcome

- Profilo: «Esporta i dati» button → a ZIP with `nido-export-YYYY-MM-DD.json` (profile, couple, members and every couple-scoped table: events, lists, tasks, attachments metadata, notes, answers, decisions, votes, wishlist, facts, capsules, plans, nudges, savings, loyalty, moods, stickies, memories metadata, cycle own data) and a `photos/` folder (memory, list and avatar objects) when present.
- The export reads only what the account can already see (RLS), so a private cycle log stays out of the partner's export.
- Progress + success toast; no server-side storage of the file.

## Proposed Implementation

- `features/profile/exportData.ts` (state layer): paginated selects per table, JSON assembly with a manifest (date, counts), lazy `import('jszip')` for the archive, blob download.
- `features/profile/ExportCard.tsx` on `ProfilePage`; the dependency is loaded only at export time.

## Relevant Files

- `app/src/features/profile/ProfilePage.tsx` + the new card/module.
- `docs/legal/LEGAL-NOTES.md` — the JSZip dependency logged.

## Verification Procedure

- Export a populated account → the ZIP opens, JSON parses, photos match, counts agree; a partner's export does not contain private rows of the other.
- `npm run build` + `npm run lint` green.

## Notes

- JSZip is loaded lazily: zero weight on normal loads. Owner step: none (client-only).

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `features/profile/exportData.ts` (paginated selects over the 23 visible tables, signed-URL photo fetch per bucket, lazy `import('jszip')`, ZIP download with manifest + counts) and `ExportCard` in Profilo; JSZip is a separate lazy chunk (≈28 KB gzip, zero cost on normal loads) and is logged in `docs/legal/LEGAL-NOTES.md`.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
