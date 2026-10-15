---
id: TASK-WISH-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: wishlist
severity: Low
opened: 2026-10-14
done: null
next: Implemented and green (partner/own groups, editor with price/link/priority, preso toggle recording the buyer, Realtime); pending the owner's two-account check.
related: [PLAN-VITTORIOGIORDANOYBQ-001, TASK-CAL-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Wishlist with gift radar hooks

## Task Description

M2 / Fase 2.3. Each partner keeps a wishlist (title, link, price, notes, priority); the
other can see it, mark items as bought, and (later) get reminded before birthdays and
anniversaries. `wishlist_items` exists since M0; the RLS is couple-wide.

Impact: it turns the calendar's birthdays and anniversaries into something actionable.

## Desired Outcome

- `/us/wishlist`: items grouped by owner ("Desideri di {name}" / "I tuoi"), with price and
  link; add/edit/delete; "preso" toggle that records who bought it.
- Realtime updates between the partners.
- `npm run build` + `npm run lint` green; two-profile check.

## Proposed Implementation

- `app/src/features/wishlist/useWishlist.ts` (NEW) — CRUD + purchase toggle, Realtime.
- `app/src/features/wishlist/WishlistPage.tsx` + `WishlistEditor.tsx` (NEW) — grouped list,
  editor overlay (title, url, price, currency, notes, priority).
- `app/src/app/router.tsx` — route `/us/wishlist`; link from the "Noi" hub.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `wishlist_items`.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — `wishlist_items_*` policies.

## Verification Procedure

- Two profiles: add an item → the partner sees it; mark it bought → the state syncs.
- `cd app && npm run build && npm run lint`.

## Notes

- The gift radar (birthdays/anniversaries within 30 days from `events`, wishlist reminders)
  is a follow-up: it needs the calendar recurrences first (TASK-CAL-VITTORIOGIORDANOYBQ-002)
  and a delivery channel (push or in-app).
- Prices are plain numbers with a currency label; no conversion.

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; implementing the wishlist (CRUD, preso toggle, Realtime).
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented `useWishlist` (couple-wide CRUD, upsert of the `preso` state with `purchased_by`, Realtime), `WishlistPage` (groups "I desideri di {partner}" / "I tuoi", price formatted with Intl, external link, notes, priority, toggle) and `WishlistEditor` (title/link validated http(s)/price/currency/priority/notes); route `/us/wishlist` and the Noi hub card switched to ready. `npm run build` + `npm run lint` green.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; implementing the wishlist (CRUD, preso toggle, Realtime).

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
