---
id: TASK-CANV-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: canvas
severity: Medium
opened: 2026-10-15
done: null
next: Proposed; ready to claim (Fase 4.1) once M3 is closed.
related: [PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Realtime canvas

## Task Description

M4 / Fase 4.1. A shared board for live two-way drawing: strokes travel over Realtime Broadcast (ephemeral, not persisted server-side); the final image is saved to Storage through `canvases`.

## Desired Outcome

- A board with a small palette, live strokes visible on both devices (channel `couple:{id}:canvas`), clear and undo, save as PNG to `canvases` plus Storage, and reopening from the saved image.
- `npm run build` + `npm run lint` green; two-device pass.

## Proposed Implementation

- `app/src/features/canvas/**` with a canvas engine (pointer events; decide a tiny dependency vs hand-rolled at claim); Broadcast through the existing Supabase client.
- Pointer math stays in refs, out of React state (chatty re-renders would eat the frame budget).

## Relevant Files

- `supabase/migrations/20261014133040_nido_realtime.sql` — realtime patterns.
- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `canvases`.
- PLAN-001 §Realtime, push and Edge Functions — broadcast channel design.

## Verification Procedure

- Two profiles on two devices: strokes appear live both ways; reload keeps the saved PNG; no strokes persisted in the database.

## Notes

- Broadcast is ephemeral by design; late joiners see only the saved image.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
