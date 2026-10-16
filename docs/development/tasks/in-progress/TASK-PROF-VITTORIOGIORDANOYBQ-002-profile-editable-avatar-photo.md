---
id: TASK-PROF-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: profile and personalization
severity: Low
opened: 2026-10-16
done: null
next: "Implemented (avatars bucket, upload/remove in Profilo, photo in the shell header and assignee chips, core photo pipeline shared with lists); owner step: paste apply-avatars-bucket.sql, then the two-account check."
related: [TASK-PROF-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Profile: editable avatar photo

## Task Description

Owner request (2026-10-16): the circle with initials in the app shell header (it shows the
**partner's** initials, which caused the "why a G?" confusion) should become an editable
profile photo. `profiles.avatar_url` already exists since the initial schema — the signup
trigger fills it from OAuth metadata when present — but nothing in the app ever shows or
edits it.

## Desired Outcome

- Profilo → *Il tuo profilo*: a photo row with the current avatar (photo or initials
  fallback), **Cambia foto** and **Rimuovi**; the upload is downscaled client-side
  (max 512 px) before hitting Storage.
- The photo shows in the app shell header (the partner's avatar, replacing the initials),
  in the profile card and on the list assignee chips; everything falls back to initials
  when there is no photo or when signing fails.
- External OAuth avatar URLs keep working as they are (no re-upload needed).
- Uploaded objects live in the private `avatars` bucket under `<couple_id>/<file>`;
  changing or removing the photo cleans the previous object (best effort, only when unused).
- `npm run build` + `npm run lint` green; two-account check by the owner.

## Proposed Implementation

- Migration `20261016140000_nido_avatars_bucket.sql` (+ `apply-avatars-bucket.sql`,
  `apply-all.sql`): private `avatars` bucket with the four couple-scoped storage policies
  (same helpers as `list-photos`). No table change: `profiles.avatar_url` holds either an
  external URL or the storage path.
- `app/src/core/photos.ts` (new): the generic photo pipeline (downscale, `uploadPhoto`,
  `signPhotoUrls`, `photoPathFor`, `MAX_PHOTO_BYTES`) moved out of the lists feature;
  `features/lists/photos.ts` keeps framing, `removePhotoIfUnused` and thin wrappers so the
  lists code is untouched.
- `CoupleProvider`: `avatar_url` on members, resolved to a display URL (external as-is,
  paths signed).
- `useProfile`: `avatarRaw` + `avatarUrl` state, `uploadAvatar`, `removeAvatar`,
  `avatarBusy`; old object cleanup.
- `ProfileCard`: avatar row with the photo picker; `AppShell` and `ListView` chips render
  the photo when available.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `profiles.avatar_url`.
- `app/src/features/profile/**`, `app/src/app/AppShell.tsx`, `app/src/features/lists/ListView.tsx`.
- `app/src/features/lists/photos.ts` — the helpers being generalized.

## Verification Procedure

- Two-account: change the avatar on one side → the partner sees it in the header after the
  next load; remove it → initials come back; a Google account keeps its OAuth photo.
- Downscale check: a >5 MB file is rejected; a large photo lands in Storage under ~512 px.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- The header circle is the partner's avatar on purpose; the user's own photo lives in
  Profilo.
- Profiles are not on Realtime: the partner sees a new avatar on the next load/refresh
  (same as display-name changes today). Accepted limitation.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; implementing the avatar photo in this session.
- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261016140000_nido_avatars_bucket.sql` (private `avatars` bucket + couple-scoped storage policies) with `apply-avatars-bucket.sql` and `apply-all.sql`; photo pipeline moved to `core/photos.ts` (lists helpers now thin wrappers, framing stays in the feature); `CoupleProvider` resolves member avatars (external OAuth URLs as-is, stored paths signed); `useProfile` gains `uploadAvatar` (512 px downscale) / `removeAvatar` with old-object cleanup; `ProfileCard` photo row; the shell header and the list assignee chips show the photo with the initials fallback. `npm run build` + `npm run lint` green; the two-account check is the owner step.
- 2026-10-16 — status Proposed → In Progress

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
