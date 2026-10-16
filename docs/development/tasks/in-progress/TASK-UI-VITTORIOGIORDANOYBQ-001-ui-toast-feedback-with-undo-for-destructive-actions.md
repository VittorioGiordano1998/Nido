---
id: TASK-UI-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: ui polish
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented; the two-account pass is the owner step."
related: []
superseded_by: null
---

# Task: UI: toast feedback with undo for destructive actions

## Task Description

Owner request (2026-10-16): the app only shows inline `ErrorBanner`s; successful saves and
deletions have no feedback and destructive actions are irreversible. Add a toast layer with
an "Annulla" action on destructive operations, so a mis-tap is recoverable without a
confirm dialog.

## Desired Outcome

- `ToastProvider` + `useToast` + a viewport rendered above the bottom nav (fixed,
  safe-area aware, stacking up to ~3, auto-dismiss ~5 s, action button extends the window).
- Tones: success, error, info; `aria-live` so screen readers hear them; reduced-motion
  respected; theme tokens only.
- Destructive actions in notes, calendar events, lists (list + item), wishlist, capsules,
  stickies, memories and bucket items show a toast with "Annulla"; tapping it restores the
  exact row (same id) through the owning state hook, so Realtime stays consistent.
- Errors that used to surface only inline keep working; toasts complement, not replace.
- `npm run build` + `npm run lint` green.

## Proposed Implementation

- `app/src/ui/toast.tsx` (new): context + provider + viewport; `showToast({ message, tone,
  action })`; timers cleaned on unmount; motion-safe entrance.
- `main.tsx`: wrap the router with `ToastProvider`.
- State hooks gain a restore counterpart used by undo: `useNotes` (`restoreNote`),
  `useEvents` (`restoreEvent`), `useLists` (`restoreTask`, `restoreList`), `useWishlist`
  (`restoreItem`), `useCapsules` (`restoreCapsule`), plus the new hooks (stickies,
  memories, bucket). Each re-inserts the captured snapshot (ids preserved) and upserts it
  locally.
- Pages call `toast.show({ message, action: { label: 'Annulla', onAction: … } })` on
  delete/dismiss; a few saves copy actions get a silent "Fatto" where the UI has no other
  confirmation (e.g. invite-code copy).

## Relevant Files

- `app/src/ui/components.tsx` — the current feedback primitives.
- `app/src/features/notes/useNotes.ts`, `app/src/features/calendar/useEvents.ts`,
  `app/src/features/lists/useLists.ts`, `app/src/features/wishlist/useWishlist.ts`,
  `app/src/features/capsules/useCapsules.ts` — delete flows to wire.
- `app/src/main.tsx` — provider nesting.

## Verification Procedure

- Delete one item per area → toast appears with Annulla; undo restores the row and the
  partner sees it come back over Realtime; without undo the deletion sticks.
- Toasts stack, dismiss on their own, and do not cover the bottom nav.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- Restoring a snapshot re-inserts with the original id; `updated_at` columns get a fresh
  value via triggers (accepted).
- The toast layer is a View; it must not fetch anything.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `ui/toast.tsx` (provider mounted above the router in `main.tsx`, stacking up to 3, auto-dismiss 5 s / 8 s with action, action button, `onExpire` hook for deferred cleanup, aria-live, motion-safe entrance); restore counterparts added to `useNotes`, `useEvents`, `useLists` (task and list; a restored list brings its tasks back, without the cover), `useWishlist`, `useCapsules`, `useSavings`, `useLoyalty` and the new stickies/memories/bucket hooks; delete/dismiss flows in Note, Calendario, ListView, Wishlist, Capsule, Risparmi, Tessere, Home (bigliettini), Ricordi and Bucket now show the "Annulla" toast (Ricordi also releases the photo when the window closes).

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
