---
id: TASK-ROB-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: robustness
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; a foreground/background pass on the phone is the remaining check."
related: []
superseded_by: null
---

# Task: Robustness: resync when the app comes back to the foreground

## Task Description

On mobile the PWA stays suspended for hours; when it comes back the Realtime channel may still be reconnecting and the lists can show stale data until the next navigation. Owner request (2026-10-16): a silent resync when the app returns to the foreground or the network comes back.

## Desired Outcome

- Returning to the app (visibilitychange → visible) or regaining connectivity (`online`) triggers a silent refresh of the main state hooks; the screen updates without a spinner.
- No duplicate refreshes: one event, one refresh per subscribed hook.

## Proposed Implementation

- `app/src/core/resync.ts`: a tiny listener bus (`subscribeToAppResync`) wired once to `document.visibilitychange` (only when becoming visible) and `window.online`.
- The list-bearing hooks subscribe with their existing `refresh` (events, lists, notes, daily question, moods, stickies, memories, bucket, wishlist, week plan, capsules, decisions, facts, savings, loyalty).

## Relevant Files

- `app/src/core/resync.ts` (new).
- `app/src/features/**/use*.ts` — one subscription line each.

## Verification Procedure

- On a phone (or DevTools): background the PWA, change data from a second account, foreground it → the change is visible without navigating.
- `npm run build` + `npm run lint` green.

## Notes

- The refresh is silent by design: hooks keep the previous data until the new one arrives.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `core/resync.ts` (listener bus wired once to `visibilitychange` → visible and `online`) plus a subscription line with `refresh` in 15 state hooks (events, lists, notes, question, moods, stickies, memories, bucket, wishlist, week plan, capsules, decisions, facts, savings, loyalty): returning to the app refreshes the data silently.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
