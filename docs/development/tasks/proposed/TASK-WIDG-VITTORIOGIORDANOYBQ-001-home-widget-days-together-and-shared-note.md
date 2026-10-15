---
id: TASK-WIDG-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: widget
severity: Low
opened: 2026-10-15
done: null
next: Proposed; needs the packaged shell (TASK-PACK-VITTORIOGIORDANOYBQ-001); a plain-web home widget is not portable.
related: [TASK-PACK-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Home widget: days together and shared note

## Task Description

M4 / Fase 4.2. A home-screen widget (days together plus the shared note). Home-screen widgets are not portable on the plain web; this lands with the packaged app.

## Desired Outcome

- A widget configuration (which data it shows) and a widget rendering days together and the couple's shared note, refreshing on a sensible cadence.
- Android first if the Apple path is slower; gate: widget live on a device.

## Proposed Implementation

- A Capacitor plugin or a small native snippet inside the packaged shell (decided in TASK-PACK-VITTORIOGIORDANOYBQ-001); data from the existing tables.
- No new server surface.

## Relevant Files

- `app/src/features/home/` — the data shapes.
- TASK-PACK-VITTORIOGIORDANOYBQ-001 — the shell this lives in.

## Verification Procedure

- Widget shows on the device home screen, reflects a changed note after refresh, and survives a reboot.

## Notes

- Scope depends on the packaging answer; probe both platforms at claim.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
