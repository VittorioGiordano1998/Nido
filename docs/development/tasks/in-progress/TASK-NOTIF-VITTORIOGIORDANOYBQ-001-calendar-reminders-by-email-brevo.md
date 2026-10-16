---
id: TASK-NOTIF-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: notifications
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented and deployed (send-reminders v5): email channel via Brevo (secrets EMAIL_FROM + APP_URL set, BREVO_API_KEY owner-set). Owner check remains: create an event ~20 minutes out, keep the app open a moment, close everything — the email should arrive ~15 minutes before (within the 5-minute cron); confirm in the Brevo log."
related: [TASK-CAL-VITTORIOGIORDANOYBQ-003, TASK-PUSH-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Calendar reminders by email (Brevo)

## Task Description

Calendar reminders reach the couple through a local browser notification while the app is open and Web Push with a server cron (TASK-CAL-VITTORIOGIORDANOYBQ-003) for the app-closed case. The owner's tests (2026-10-16, Android) showed the push path is not dependable in practice: delivery depends on browser/PWA state, subscriptions and OS background policies, so "the reminder arrives at its moment with the app closed" is not a promise the app can keep yet.

Owner decision (2026-10-16): add email as the guaranteed delivery channel for calendar reminders, with Brevo as the transactional provider (signup, sender verification and the API key are owner steps). The server cron already computes what is due; the email send rides the same loop.

## Desired Outcome

When a reminder comes due, `send-reminders` (called by the pg_cron job `nido-push-reminders` every 5 minutes) sends an email in addition to the existing best-effort Web Push attempt.

- Recipients mirror the push rules: couple events go to both partners; private events (`only_for`) only to their creator.
- Recipient addresses come from Supabase Auth (`auth.users` via the service-role admin API): no schema change.
- Contents: subject `Promemoria: {title}`, the same line as the push (`Alle 9:15 · Luogo · Si ripete`) and a link to `/calendar` (app URL from configuration).
- Failures are logged per recipient and the row is still marked `sent_at`: the reminder is a one-shot at its instant, like the push path. Reliability comes from the server-side pipeline, not from client state.
- README and LEGAL-NOTES document setup and the new processor.

## Proposed Implementation

- `supabase/functions/send-reminders/index.ts`: read `BREVO_API_KEY`, `EMAIL_FROM` (plain address or `Name <addr>`), `APP_URL`; resolve recipient emails via `supabase.auth.admin.getUserById`; query `profiles.display_name` for the `to` name; `POST https://api.brevo.com/v3/smtp/email` per recipient with escaped HTML + plain text; count `emails` in the response; log failures.
- Secrets: `BREVO_API_KEY`, `EMAIL_FROM` (verified sender), `APP_URL`.
- No app changes, no migration; deploy `send-reminders` again.
- Docs: README push section gains the email steps; LEGAL-NOTES gains the Brevo row.

## Relevant Files

- `supabase/functions/send-reminders/index.ts` — the function to extend.
- `supabase/functions/send-push/index.ts` — delivery/pruning pattern to mirror.
- `docs/development/tasks/in-progress/TASK-CAL-VITTORIOGIORDANOYBQ-003-calendar-push-reminders-with-a-server-cron.md` — the cron this extends.
- `README.md` §Push (step list), `docs/legal/LEGAL-NOTES.md`.

## Verification Procedure

- Manual invocation of `send-reminders` with a due test row: response reports `emails >= 1`; Brevo transactional logs show the message as delivered; `push_reminders.sent_at` is set; the test row is deleted afterwards.
- Live check (owner): create an event ~20 minutes out, keep the app open a moment (materialization), then close everything: the email arrives about 15 minutes before the event (±5 minutes for the cron).
- Private event: the email reaches only the creator's address.

## Notes

- Brevo free tier (~300 emails/day) is ample for two users; one email per recipient per occurrence.
- The sender address must be verified in Brevo before the first send; no custom domain is required (the owner verified a Gmail address).
- V1 does not retry a failed email (same one-shot semantics as push); a later task can add retry if real usage shows losses.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — VITTORIOGIORDANOYBQ — claimed; implementing the Brevo email channel in send-reminders (email alongside the best-effort push, secrets EMAIL_FROM/APP_URL, deploy, README + LEGAL-NOTES, live check).
- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `send-reminders` sends email via Brevo alongside the push (addresses from `auth.users`, `to` name from `profiles.display_name`, subject `Promemoria: {title}`, same body as the push plus an `APP_URL` link, escaped HTML and plain text, per-recipient failure logging, `emails` in the response); `EMAIL_FROM` (vgiordano12345@gmail.com) and `APP_URL` secrets set; function deployed (v5); README (Email dei promemoria) and LEGAL-NOTES (Servizi esterni) updated. The CLI cannot reach the database from this machine (IPv6 unsupported on the network; `supabase link` needs the DB password), so the pre-flight checks and the live delivery check run from the SQL editor.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
