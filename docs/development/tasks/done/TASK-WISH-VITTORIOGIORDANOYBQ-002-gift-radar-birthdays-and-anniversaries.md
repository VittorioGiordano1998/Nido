---
id: TASK-WISH-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: wishlist
severity: Low
opened: 2026-10-15
done: 2026-10-15
next: null
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
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; occasion tag on events (birthday/anniversary + target) and the radar section.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261015163000_nido_event_occasions.sql` (`events.occasion`/`occasion_for` + check) with `apply-occasions.sql` and `apply-all.sql`; `useEvents` carries the fields; the event editor gained "Occasione speciale" + "Per" (members) and the agenda labels "· compleanno/anniversario"; the Wishlist page gained the radar (30-day window over expanded occurrences, days-left chip, the tagged person's untaken wishes as hints). `npm run build` + `npm run lint` green.
- 2026-10-15 — VITTORIOGIORDANOYBQ — Owner verification passed on the live app (two-account pass, 2026-10-15); closed in the phase close-out.

## Resolution

Implemented: `events.occasion`/`occasion_for` with the editor fields ("Occasione speciale" + "Per") and agenda labels, and the radar section in the Wishlist page (30-day window over expanded occurrences, days-left chip, the tagged person's untaken wishes as hints). `apply-occasions.sql` pasted; owner check on 2026-10-15. The push digest remains future work with TASK-PUSH-VITTORIOGIORDANOYBQ-001.
