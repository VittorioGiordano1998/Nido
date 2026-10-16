---
id: TASK-HOME-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: home
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented; SQL applied on the live project (probed 2026-10-16); the two-account check is the remaining owner step."
related: [TASK-HOME-VITTORIOGIORDANOYBQ-001, TASK-LIST-VITTORIOGIORDANOYBQ-003, TASK-UI-VITTORIOGIORDANOYBQ-004]
superseded_by: null
---

# Task: Home hero: warm gradient and couple cover photo

## Task Description

Owner request (2026-10-16): the days-together card is the heart of the app but flat. It
becomes a proper hero — a warm gradient by default, and optionally the couple's cover photo
(choose, upload, framing) reusing the lists photo pipeline (`list-photos` bucket, framing
model, `BackdropEditor`).

## Desired Outcome

- Home hero: layered warm gradient from accent tokens with the days counter, "dal …" date
  and the two members (names + avatars) composed inside it; readable in both themes.
- When a cover photo is set, it replaces the gradient with a dark scrim so text stays
  legible; framing (x/y/zoom) is respected; partner sees changes live.
- Profile gains a "Copertina" card (or a block inside the existing personalization card):
  upload/change/remove with the shared framing editor; both partners may edit.
- Migration adds `couples.hero_path/hero_x/hero_y/hero_zoom`; `removePhotoIfUnused` also
  checks `couples` before deleting an object from `list-photos`.
- No-partner hero keeps the invite CTA path from HOME-…-001.
- `npm run build` + `npm run lint` green; migration + `apply-couple-hero.sql`;
  two-account pass by the owner.

## Proposed Implementation

- Migration `20261016200000_nido_couple_hero.sql` (+ `apply-couple-hero.sql`,
  `apply-all.sql`): four `couples` columns with range checks on x/y/zoom; `couples` added
  to the Realtime publication; no policy change (member select/update already exist).
- `app/src/features/coupling/useCoupleHero.ts` (state layer): load/update hero fields,
  upload (shared `uploadPhoto` on `list-photos`), clear, realtime channel; exports the
  signed URL.
- `app/src/features/home/HomeHero.tsx` (View): gradient/scrim + photo layer
  (`BackdropPhoto` pattern) + CountUp days + members.
- `app/src/features/profile/CoverCard.tsx` (View): reuse `BackdropEditor` for framing;
  mounts on `ProfilePage`.
- `app/src/features/lists/photos.ts`: `removePhotoIfUnused` also checks
  `couples.hero_path`.

## Relevant Files

- `app/src/features/home/HomePage.tsx` — the hero section being replaced.
- `app/src/features/lists/BackdropEditor.tsx`, `BackdropPhoto.tsx`, `photos.ts` — reused.
- `supabase/migrations/20261016140000_nido_avatars_bucket.sql` — column-addition style.

## Verification Procedure

- Two-account: set a cover on one side → the other's Home shows it live; change framing →
  live; remove → gradient returns; deleting the object only happens when unreferenced.
- Both themes: text stays readable over photo and gradient.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- `couples` joins the Realtime publication so the hero updates live; RLS already limits
  reads to members.
- Uploads are downscaled client-side (max 1600 px) like covers.
- Owner step: paste `apply-couple-hero.sql`, then the two-account pass.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261016200000_nido_couple_hero.sql` (`couples.hero_path/hero_x/hero_y/hero_zoom` with range checks; `couples` added to the Realtime publication) with `apply-couple-hero.sql` and `apply-all.sql`; `features/coupling/useCoupleHero.ts` (load, upload pending, save with framing, discard, clear, signed URL, realtime); `HomeHero` (warm accent/sage gradient by default, cover photo with the shared scrim, CountUp days, member chips, invite CTA) replacing the old days card; `CoverCard` in Profilo with the shared `BackdropEditor`; `removePhotoIfUnused` now also checks `couples.hero_path` before deleting an object.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
