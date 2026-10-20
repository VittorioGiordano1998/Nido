---
id: TASK-SEC-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Security
status: Done
area: security
severity: Medium
opened: 2026-10-20
done: 2026-10-20
next: null
related: []
superseded_by: null
---

# Task: Security hardening from the public-repo audit

## Task Description

A security audit of the public repository found: (1) link attachments and wishlist links accept `javascript:` URLs (stored XSS between partners); (2) the 8-char invite code is generated with random() and join_couple has no throttling; (3) a personal email address in a public record; (4) no security headers on Vercel; (5) the test-only reset tool is shown to every user in production; (6) nudges_insert does not constrain to_user; (7) webhook secrets are compared in non-constant time.

## Desired Outcome

All seven findings fixed in code, SQL migrations and docs: http(s)-only links enforced client-side and by DB check constraints; a 12-char CSPRNG invite code with attempt throttling; the email removed from the docs; CSP and companion headers in vercel.json; the test tools behind an opt-in VITE flag; nudges limited to the partner; constant-time secret comparison in both Edge Functions.

## Proposed Implementation

New migration nido_security_hardening plus apply script; core/links.ts helper; vercel.json headers; VITE_ENABLE_TEST_TOOLS flag; timing-safe compare in send-push and send-reminders.

## Relevant Files

`supabase/migrations/20261020090000_nido_security_hardening.sql`, `app/src/core/links.ts`, `app/vercel.json`, `app/src/core/env.ts`, the two Edge Functions `send-push` and `send-reminders`.

## Verification Procedure

`vitest run` (32 tests, including `tests/links.test.ts`), `tsc -b` and `vite build` pass; the SHA-256 of the built inline script equals the hash in the CSP of `vercel.json`. The SQL migration was reviewed but not executed (no local Postgres): apply `supabase/apply-security-hardening.sql` on the project, then try a wrong code on /pair (null couple -> "Codice non valido"), 5 wrong codes (locked for 15 minutes), a `javascript:` link insert (rejected by the check constraint).

## Notes

Not fixable from the repo: Supabase Auth settings (email confirmation, password length, leaked-password protection) and GitHub secret scanning, listed in README §Sicurezza. The previous email address stays in the git history; removing it needs a history rewrite and force push, left to the owner.

## Touch History

- 2026-10-20 — VITTORIOGIORDANOYBQ — created
- 2026-10-20 — VITTORIOGIORDANOYBQ — All seven audit findings fixed; migration still to be applied on the live project.

## Resolution

Fixed all seven audit findings. Links: `safeHttpUrl`/`parseLinkInput` gate attachments and wishlist, rendered `href`s fall back to inert, and `NOT VALID` check constraints block `javascript:` through the API (legacy rows are not scanned). Invite codes: 12 characters from a CSPRNG, `join_couple` records wrong codes in `join_attempts` and locks out after 5 in 15 minutes (a wrong code now answers null instead of raising). Nudges require a partner recipient. Vercel sends CSP, nosniff, frame, referrer, permissions and HSTS headers. `TestToolsCard` shows only with `VITE_ENABLE_TEST_TOOLS=true`. Both Edge Functions compare the webhook secret in constant time. Remaining: apply the migration on the live project and redeploy the two functions.
