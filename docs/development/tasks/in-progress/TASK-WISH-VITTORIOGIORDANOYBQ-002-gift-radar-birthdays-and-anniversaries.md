---
id: TASK-WISH-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: wishlist
severity: Low
opened: 2026-10-15
done: null
next: Blocked by TASK-CAL-VITTORIOGIORDANOYBQ-002 (recurrences) and a delivery channel (TASK-PUSH-VITTORIOGIORDANOYBQ-001); claim after both.
related: [TASK-WISH-VITTORIOGIORDANOYBQ-001, TASK-CAL-VITTORIOGIORDANOYBQ-002, TASK-PUSH-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Gift radar: birthdays and anniversaries

## Task Description

The gift radar deferred in TASK-WISH-VITTORIOGIORDANOYBQ-001 (Notes): occasions approaching within 30 days (birthdays, anniversaries) tied to the couple's wishlists. It needs recurring calendar events and a delivery channel, so it follows both.

## Desired Outcome

- A radar section in the Wishlist page: upcoming occasions with whose, date, days left and the partner's wishlist hints.
- In-app by default; a push digest when TASK-PUSH-VITTORIOGIORDANOYBQ-001 is live.
- `npm run build` + `npm run lint` green; two-account check.

## Proposed Implementation

- `app/src/features/wishlist/useGiftRadar.ts` (NEW) — reads recurring events tagged as gift occasions (agree the tagging with TASK-CAL-VITTORIOGIORDANOYBQ-002: prefer a stored tag over a title convention), joins to `wishlist_items`.
- Radar section in the Wishlist page; compute client-side — no cron required.
- Optional later: an Edge Function `gift-radar` only if a weekly push digest is wanted (decide at claim, PLAN-001 §Edge Functions).

## Relevant Files

- `app/src/features/wishlist/` — the list this feeds.
- `app/src/features/calendar/useEvents.ts` — the event pattern to follow.
- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `events`, `wishlist_items`.

## Verification Procedure

- Create a recurring birthday on one account; the radar lists it within 30 days on both; marking a wishlist item "preso" reflects in the hints.
- `cd app && npm run build && npm run lint`.

## Notes

- Do not start before recurrences (TASK-CAL-VITTORIOGIORDANOYBQ-002) land; without them there are no dates to read.
- If a title-tag convention is chosen instead, record it in the calendar task's Resolution.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
