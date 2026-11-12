---
id: TASK-SEC-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Chore
status: In Progress
area: security
severity: High
opened: 2026-11-11
done: null
next: "Findings delivered to the owner on 2026-11-11; fixes not started, waiting for the owner to choose what to fix."
related: []
superseded_by: null
---

# Task: Security review of the database, Edge Functions, storage and client

## Task Description

Owner request (2026-11-11): review the security of everything built so far, not only the latest changes — the SQL migrations and RLS policies, the three Edge Functions, the storage buckets and the web client. Follow-up to TASK-SEC-VITTORIOGIORDANOYBQ-001.

## Desired Outcome

A ranked list of findings delivered to the owner, then one fix per finding (migration, function or client change) with its own verification. Because the repository is public, the details of a finding are written to the records only together with its fix.

## Proposed Implementation

[Detailed implementation proposal, with list of files to create/modify/delete.]

## Relevant Files

[List of files to read in order to acquire context.]

## Verification Procedure

[Describe how the task result is verified: tests to run, commands, manual checks.]

## Notes

Review done by reading the code on 2026-11-11: all migrations, the three Edge Functions, `app/vercel.json`, the service worker and the client modules for auth, photos, links and push. Tracked files and the git history were scanned for keys and project references: none found. Nothing was run against the live project, so the hosted Auth settings and the policies actually applied there are not verified.

## Touch History

- 2026-11-11 — VITTORIOGIORDANOYBQ — created
- 2026-11-11 — status Proposed → In Progress

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
