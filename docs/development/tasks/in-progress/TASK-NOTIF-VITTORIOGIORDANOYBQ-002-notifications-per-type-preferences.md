---
id: TASK-NOTIF-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: notifications
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented and applied live 2026-10-16 (column present, both functions redeployed); a mute-pass check remains."
related: [TASK-PUSH-VITTORIOGIORDANOYBQ-003]
superseded_by: null
---

# Task: Notifications: per-type preferences

## Task Description

The push switch is all-or-nothing: there is no way to keep reminders but mute check-in push, or silence stickies at night. Owner request (2026-10-16): per-type preferences (events, reminders, stickies, moods, nudges) stored per account and respected server-side by send-push and send-reminders.

## Desired Outcome

- Notifications card: after the push switch, one switch per type (Novità del calendario, Promemoria eventi — push ed email, Bigliettini, Check-in del partner, Campanelli dalle liste).
- Preferences live on the account (`profiles.notification_prefs`), so they apply to every device and to server deliveries: send-push skips muted types, send-reminders skips muted reminders for push and email.
- Defaults all on; an absent/invalid value behaves as on.

## Proposed Implementation

- Migration `20261016220000_nido_notification_prefs.sql` (+ `apply-notification-prefs.sql`, `apply-all.sql`): `profiles.notification_prefs jsonb` with the five boolean keys and a default all-on.
- `features/settings/notificationPrefs.ts`: load/save the caller's prefs (optimistic toggle, error rollback); `NotificationsCard` renders the switches.
- `send-push`: table → pref key, recipient read, skip when off. `send-reminders`: skip recipients with `reminders: false` on both channels.

## Relevant Files

- `app/src/features/profile/NotificationsCard.tsx`, `app/src/features/settings/` — the UI and state.
- `supabase/functions/send-push/index.ts`, `supabase/functions/send-reminders/index.ts` — the respecting.

## Verification Procedure

- Toggle a type off → the corresponding notification does not arrive (server side); other types still do; the choice survives reload and applies on the other device.
- `npm run build` + `npm run lint` + `records check` green.

## Notes

- Owner steps: paste `apply-notification-prefs.sql`, redeploy both functions.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261016220000_nido_notification_prefs.sql` (+ `apply-notification-prefs.sql`, `apply-all.sql`) with `profiles.notification_prefs` (five keys, all on, jsonb object check); `features/settings/notificationPrefs.ts` (optimistic toggle with rollback) and five switches under "Cosa mi avvisa" in `NotificationsCard`; `send-push` skips muted types per recipient and `send-reminders` skips `reminders: false` on both push and email.

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — applied live (2026-10-16): `profiles.notification_prefs` exists on the project and `send-push`/`send-reminders` were redeployed so they read it.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
