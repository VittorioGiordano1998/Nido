---
id: TASK-UI-VITTORIOGIORDANOYBQ-003
owner: VITTORIOGIORDANOYBQ
type: Style
status: In Progress
area: ui polish
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; a visual pass on the live app is the remaining step."
related: [TASK-MEMO-VITTORIOGIORDANOYBQ-001, TASK-BUCKET-VITTORIOGIORDANOYBQ-001, TASK-PICK-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: UI: Noi hub tiles with icons

## Task Description

Owner request (2026-10-16): the "Noi" hub is a text-only list. Give every feature an icon
in a soft tinted tile so the hub is scannable at a glance, and give the new features
(Ricordi, Bucket list, Scegli per noi) their home there.

## Desired Outcome

- `/us` becomes a 2-column grid of tiles: icon in a tinted rounded square, title, one-line
  description; hover/focus states; disabled "presto" style preserved for future entries.
- New icons in the shared icon set (camera, dice/picker, checklist, sparkles) drawn in the
  existing 24 px stroke style; tint classes come from theme tokens only (no hard-coded
  colors), and stay readable in light and dark.
- Entries for all current features, including the three new ones; the nudge card and the
  closing note stay.
- `npm run build` + `npm run lint` green; visual check in both themes.

## Proposed Implementation

- `app/src/features/us/UsPage.tsx`: feature list gains `icon` and `tint` fields; the list
  becomes a `grid grid-cols-2 gap-2` of tiles.
- `app/src/ui/icons.tsx`: add the new icons (CameraIcon, DiceIcon, ChecklistIcon,
  SparklesIcon — names final in code) using `baseProps`.
- Route additions for the new pages land in the same batch (router).

## Relevant Files

- `app/src/features/us/UsPage.tsx` — the hub.
- `app/src/ui/icons.tsx` — icon set and stroke style.
- `app/src/index.css` — the token scales the tints must use.

## Verification Procedure

- Hub renders in both themes; every tile navigates; tints are token-based (grep for raw
  hex colors in the file: none).
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- Keep the tiles compact: title plus one short line; long descriptions get trimmed.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `UsPage` is now a two-column grid of tiles (tinted icon square, title, one-line description, chevron) using only theme tokens (accent/sage/neutral) with `viewTransition` navigation; new icons in the shared stroke style (Chat, Info, Hourglass, Split, Gift, Compass, Coin, Card, Camera, Checklist, Dice) added to `ui/icons.tsx`; entries for Domanda del giorno, Ricordi, Bucket list, Scegli per noi and the existing features; the nudge card and the closing note kept.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
