---
id: TASK-PICK-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: picker
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; a live manual pass is the remaining step."
related: [PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Picker: choose for us from lists, wishlist and plans

## Task Description

Owner request (2026-10-16): "Scegli per noi" — an indecision breaker. Pools drawn from
data the app already has (open list items, wishlist items, weekly-plan proposals) plus a
"noi due" pool that picks between the two partners (chores roulette). Pure client, no
schema: it reads existing state hooks and picks at random.

## Desired Outcome

- `/us/pick` page: a pool switcher (Liste / Wishlist / Piani / Noi due) and a big "Estrai"
  button; drawing cycles briefly through candidates (slot-machine feel) and settles on the
  winner card.
- Empty pool explains what to add and links to the right section.
- "Noi due" draws one of the two names (chi lava i piatti, chi sceglie il film).
- Reduced-motion: the cycling animation is skipped or shortened.
- No database changes; `npm run build` + `npm run lint` green; manual single-account check
  (two-account optional).

## Proposed Implementation

- `app/src/features/pick/PickPage.tsx` (View): pool definitions, draw logic over the hooks
  below, CSS/interval cycling with `prefers-reduced-motion` handling.
- Reads existing state hooks: `useLists` (open tasks), `useWishlist`, `useWeekPlan`,
  `useCouple` (members). No new hook needed; no writes.
- Noi hub entry ("Scegli per noi").

## Relevant Files

- `app/src/features/lists/useLists.ts`, `app/src/features/wishlist/useWishlist.ts`,
  `app/src/features/weekplan/useWeekPlan.ts` — the pools.
- `app/src/features/capsules/CapsulesPage.tsx` — Noi sub-page header pattern.

## Verification Procedure

- Each pool with data draws a candidate from that pool; empty pool shows the hint; re-draw
  works; reduced-motion skips the cycling.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- No writes: a new list item or wish is added from its own section, the picker only picks.
- The draw is local randomness — no server involvement, nothing persisted.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `features/pick/PickPage.tsx` with four pools read from the existing hooks (open list items with their list name, untaken wishes with the owner, week plans with status, the two members), a slot-machine cycle that settles on the winner, shortcuts for reduced motion and single-candidate pools, an empty state linking to the right section, and timers cleaned on unmount; route `/us/pick` and the Noi hub tile. No schema, no writes.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
