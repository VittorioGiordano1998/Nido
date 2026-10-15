---
id: KI-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
status: Fixed
area: realtime
severity: Medium
opened: 2026-10-15
fixed: 2026-10-15
related: [TASK-CAL-VITTORIOGIORDANOYBQ-002, TASK-WISH-VITTORIOGIORDANOYBQ-002, TASK-PUSH-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Known Issue: Realtime: two hooks on the same channel topic crash the second subscriber

## Symptom

On the live app some pages log `Uncaught Error: cannot add postgres_changes callbacks for realtime:events-<couple> after subscribe()` and the second subscription never delivers updates (Realtime goes silent on that page, without an obvious UI fault).

Reproduction: open `/calendar`, the Home page or the wishlist on the deployed app — each mounts a second `useEvents()` next to the shell's reminder hook (`useEventReminders`).

## Root cause

supabase-js `client.channel(topic)` returns the existing channel for a topic already registered; `useEventReminders` (shell, added with the recurrences) subscribes to `events-<couple>` on every page, and the page-level hooks (calendar, `useUpcomingEvents` on Home, the wishlist radar) then call `.on()` on that same subscribed channel and throw. In development React StrictMode hits the same reuse, because `removeChannel` is asynchronous and the second mount finds the channel still registered.

## Attempted fixes

[Optional: fixes tried that did not resolve the issue, and why.]

## Fix direction

Give every subscription a unique topic through a shared helper (`app/src/core/realtime.ts`, `uniqueChannelTopic`), applied to all the realtime hooks; a mechanism check (`npm run check:channels`) pins the behaviour.

## Fix

[For fixed issues: what was changed and how it was verified.]

## Notes

[Optional: related issues, affected areas, references, open questions.]
