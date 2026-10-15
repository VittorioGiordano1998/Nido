---
id: TASK-PACK-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: store packaging
severity: Medium
opened: 2026-10-15
done: null
next: Proposed; after private use and TASK-GDPR-VITTORIOGIORDANOYBQ-001; sign-in and payments answers land here.
related: [ADR-WEB-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002, TASK-GDPR-VITTORIOGIORDANOYBQ-001, TASK-PREM-VITTORIOGIORDANOYBQ-001, TASK-PUSH-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Store packaging: Capacitor shell and store forms

## Task Description

ADR-WEB-VITTORIOGIORDANOYBQ-001: Capacitor is the later path to the app stores; the web app ships first. Packaging carries store-review requirements with it: Google Play Data safety and Apple App Privacy forms, Sign in with Apple (required when a third-party sign-in like Google is offered), push inside the packaged shell, and the payments answer from TASK-PREM-VITTORIOGIORDANOYBQ-001.

## Desired Outcome

- A Capacitor shell around `app/` producing installable Android and iOS artifacts, with icons and splash screens.
- Store checklists drafted and answerable: data safety, privacy, sign-in, payments, deletion (TASK-GDPR-VITTORIOGIORDANOYBQ-001).
- Manual pass on a real device build; README build steps.

## Proposed Implementation

- New wrapper folder (`mobile/` or `app/capacitor/` — decide at claim) pointing at the built `dist`; Capacitor config plus platform folders.
- Revisit push for the WebView context (ADR-PUSH-VITTORIOGIORDANOYBQ-001 records FCM as the fallback) and add Sign in with Apple if the Google provider stays.
- Payments: implement whatever the PREM ADR chose for the store side.

## Relevant Files

- `docs/development/architecture/adr/accepted/ADR-WEB-VITTORIOGIORDANOYBQ-001-*.md`.
- `app/` — build output and configuration.
- `docs/legal/LEGAL-NOTES.md` — store assets and licenses.

## Verification Procedure

- Device build: login, pairing, calendar/lists/notes flows, deep links; no crash on cold start.
- Store checklist forms completed in draft; push decision revisited and recorded.

## Notes

- After private use and the deletion flow; expects the payments answer from TASK-PREM-VITTORIOGIORDANOYBQ-001.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
