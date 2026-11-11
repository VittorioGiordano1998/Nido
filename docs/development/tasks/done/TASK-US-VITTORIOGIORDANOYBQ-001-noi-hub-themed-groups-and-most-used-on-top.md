---
id: TASK-US-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: noi hub
severity: Low
opened: 2026-11-11
done: 2026-11-11
next: null
related: []
superseded_by: null
---

# Task: Noi hub: themed groups and most used on top

## Task Description

Owner request (2026-11-11): the "Noi" hub is a uniform grid of eleven tiles; nothing stands out and related features are not grouped.

## Desired Outcome

- Features grouped by theme: rituals, memories and dreams, practical.
- The three most used features of this device sit on top as larger tiles, with a sensible default before any usage exists.
- The outdated "sections switch on one at a time" card is gone.

## Proposed Implementation

- `app/src/features/us/features.ts`: the feature catalog with groups (also consumed by the global search).
- `app/src/features/us/useHubUsage.ts`: per-device usage counter in `localStorage` (`nido.us.usage.v1`).
- `app/src/features/us/UsPage.tsx`: grouped layout.

## Relevant Files

- `app/src/features/us/UsPage.tsx`.
- `app/src/features/settings/SettingsProvider.tsx` — the existing per-device `localStorage` pattern.

## Verification Procedure

- `cd app && npm run build && npm run lint && npm test`.
- Browser: open a feature several times and check it moves to the top row.

## Notes

- Usage counts stay on the device: no schema change.

## Touch History

- 2026-11-11 — VITTORIOGIORDANOYBQ — created
- 2026-11-11 — status Proposed → In Progress
- 2026-11-11 — status In Progress → Done

## Resolution

- `app/src/features/us/features.ts`: the feature catalog with three groups (rituals, memories and dreams, practical), also used by the global search.
- `hubUsage.ts` (pure ranking, tested) and `useHubUsage.ts` (per-device counters in `localStorage`, key `nido.us.usage.v1`): the three most opened features sit on top, with defaults before any usage.
- `UsPage.tsx`: featured tiles, then one list per group; the outdated "sections switch on one at a time" card is gone.

Verified on 2026-11-11 with `npm run build`, `npm run lint` (warnings only, none new) and `npm test` (10 files, 60 tests), plus a Playwright pass at 390x844 and 1440x900 in light and dark. The browser pass ran against a simulated backend (requests intercepted in the browser, invented data) because `app/.env.local` was not available on the machine.

Remaining limitation: not yet checked against the real Supabase project (Realtime delivery, real photos, real account). Usage is counted for features opened from the hub.
