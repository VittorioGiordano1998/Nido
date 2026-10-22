---
id: TASK-UI-VITTORIOGIORDANOYBQ-008
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

# Task: Precarica le foto delle liste

## Task Description

Switching from home to lists still shows a delay before the cover photos appear. The URL
cache removed the re-signing, but the lists screen still waits for its data and then
downloads each image when it mounts.

## Desired Outcome

List covers are warmed while the home screen loads the lists, and the lists screen reads
known URLs on its first render, so the covers paint at once.

## Proposed Implementation

- `core/photos.ts`: `cachedSignedUrls` reads the cache synchronously; `preloadPhotos` signs
  the paths and warms the browser cache with `new Image()`.
- `features/lists/usePhotoUrls.ts`: initial state comes from the cache.
- `features/lists/useLists.ts`: after a successful load, preload the cover paths.

## Desired Outcome

[Describe what would be the desired condition after task is complete.]

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

- `core/photos.ts`: `cachedSignedUrls` (synchronous read) and `preloadPhotos` (warm the
  browser cache); `signPhotoUrls` now reuses `cachedSignedUrls`.
- `features/lists/usePhotoUrls.ts`: the initial state is read from the cache.
- `features/lists/useLists.ts`: the cover paths are preloaded after each successful load.
  The home screen loads the lists through `useOpenTasks`, so the covers are warm before the
  user opens the lists tab.
- `app/tests/photos-cache.test.ts`: a test for the synchronous read (37 tests pass).

Verified with `npm test` (37 pass), `tsc --noEmit` on `tsconfig.app.json` (clean) and
`npm run build` (succeeds).

Not checked in a browser. Limits: only list covers are preloaded; the photos attached to
items are still loaded when their sheet opens.
