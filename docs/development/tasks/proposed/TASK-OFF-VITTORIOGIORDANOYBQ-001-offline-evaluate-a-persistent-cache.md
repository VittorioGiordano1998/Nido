---
id: TASK-OFF-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Chore
status: Proposed
area: offline
severity: Low
opened: 2026-10-15
done: null
next: Proposed; evaluate in M2 on real usage (PLAN-VITTORIOGIORDANOYBQ-001 decision 10); no cache before evidence.
related: [PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002, TASK-WEB-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Offline: evaluate a persistent cache

## Task Description

PLAN-VITTORIOGIORDANOYBQ-001 decision 10: online-first for the MVP, with a persistent local cache evaluated in M2 on real usage. Today nothing is cached beyond the SPA shell. Decision, not implementation: the outcome is a recorded choice with evidence.

## Desired Outcome

- A written decision (Resolution here, plus an ADR if architectural): which reads must survive a dropped connection for the couple's real usage (calendar, lists, notes are the candidates), which storage path fits (Cache API, IndexedDB, or a small Vite PWA plugin), and what degrades cleanly.
- If the answer is "cache", a follow-up implementation task is created with the chosen approach; if "no cache", the evidence and rationale are recorded.

## Proposed Implementation

- Gather real usage notes from the owner (where the connection drops, what the couple reaches for first).
- Prototype the storage options against `app/vite.config.ts` (service worker discipline: no cache until this decision).
- No schema changes.

## Relevant Files

- `app/src/core/` — client and env.
- `app/vite.config.ts` — build and service worker configuration.
- `docs/development/plans/agreed/PLAN-VITTORIOGIORDANOYBQ-001-*.md` — decision 10 and §Risks.

## Verification Procedure

- The decision names the measured basis (usage observations) and the smallest workable mechanism; if implemented, a manual pass with the network off shows the promised reads.
- `npm run build` + `npm run lint` stay green.

## Notes

- Not to be confused with push: notifications ride the network; this is about reads when it is gone.
- Keep the service worker tiny for TASK-PUSH-VITTORIOGIORDANOYBQ-001 (ADR-PUSH-VITTORIOGIORDANOYBQ-001).

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
