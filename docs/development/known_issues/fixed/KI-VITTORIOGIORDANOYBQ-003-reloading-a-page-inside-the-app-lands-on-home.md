---
id: KI-VITTORIOGIORDANOYBQ-003
owner: VITTORIOGIORDANOYBQ
status: Fixed
area: coupling
severity: Medium
opened: 2026-11-11
fixed: 2026-11-11
related: [TASK-UI-VITTORIOGIORDANOYBQ-010]
superseded_by: null
---

# Known Issue: Reloading a page inside the app lands on Home

## Symptom

Reloading the browser on any page other than Home (for example `/us` or `/lists`), or opening a deep link, briefly shows a spinner and then lands on Home instead of the requested page.

## Root cause

`app/src/features/coupling/CoupleProvider.tsx`: while the auth session is still loading, `refresh` runs with no user and sets `loading` to false. When the session arrives there is one render where the user is signed in, `loading` is false and `couple` is still null, before the effect starts the fetch. `RequireCouple` (`app/src/app/guards.tsx`) reads that as "no couple" and redirects to `/pair`, which redirects to `/` once the couple loads.

## Attempted fixes

None.

## Fix direction

Treat the couple as still loading until it has been resolved for the signed-in user.

## Fix

`CoupleProvider` records the user id the couple was last resolved for (`resolvedFor`) and exposes `loading` as true until it matches the signed-in user, so the guard waits instead of redirecting.

Verified on 2026-11-11 in the browser (Playwright, simulated backend): a full reload on `/us`, `/lists`, `/calendar`, `/notes` and `/us/memories` stays on that page; before the fix each of them ended on `/`. `npm run build`, `npm run lint` and `npm test` pass.

## Notes

Found during the browser pass of TASK-UI-VITTORIOGIORDANOYBQ-010. Push-notification and invite deep links go through the same guard.
