---
id: TASK-UI-VITTORIOGIORDANOYBQ-007
owner: VITTORIOGIORDANOYBQ
type: null
status: Done
area: UI
severity: null
opened: 2026-10-22
done: 2026-10-22
next: null
related: []
superseded_by: null
---

# Task: Caricamento foto più veloce

## Task Description

Photos load slowly. Signed URLs are re-created on every screen mount, so the browser cache
never hits, and some images below the fold are not lazy-loaded.

## Desired Outcome

Signed URLs are reused for the session while they have life left, and every photo in the
lists, bucket and memories screens loads lazily with async decoding.

## Proposed Implementation

[Detailed implementation proposal, with list of files to create/modify/delete.]

## Relevant Files

[List of files to read in order to acquire context.]

## Verification Procedure

[Describe how the task result is verified: tests to run, commands, manual checks.]

## Notes

[Optional constraints, dependencies, references or risks.]

## Touch History

- 2026-10-22 — VITTORIOGIORDANOYBQ — created
- 2026-10-22 — status Proposed → In Progress
- 2026-10-22 — status In Progress → Done

## Resolution

- `app/src/core/photos.ts`: `signPhotoUrls` keeps an in-memory cache keyed by bucket and
  path. A cached URL is reused while it has more than 5 minutes left; only the missing paths
  go to `createSignedUrls`.
- `loading="lazy"` and `decoding="async"` added to the list avatars, the bucket cards, the
  task attachments and the memory thumbnails (the memory cards already had lazy loading).
- `app/tests/photos-cache.test.ts`: four tests cover reuse, partial signing, bucket
  separation and the empty case.

Verified with `npm test` (36 tests pass, the new four included), `tsc --noEmit` on
`tsconfig.app.json` (clean) and `npm run build` (succeeds).

Limitations: the cache lives in memory, so it resets on a full page reload. Images are still
full size (1600 px); the thumbnail work is a separate decision, not part of this task.
