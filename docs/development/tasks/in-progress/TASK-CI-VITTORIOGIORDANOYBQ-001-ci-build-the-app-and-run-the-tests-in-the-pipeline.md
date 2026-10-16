---
id: TASK-CI-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Chore
status: In Progress
area: ci pipeline
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; the jobs run on the next pipeline."
related: [TASK-QA-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: CI: build the app and run the tests in the pipeline

## Task Description

The CI (`.gitlab-ci.yml`) runs commitlint, markdownlint and the record checks only: a TypeScript error reaches `main` and is caught only by the Vercel build. Owner request (2026-10-16): make the pipeline compile the app and run its tests.

## Desired Outcome

- CI stages gain `test` and `build`; jobs `app-test` and `app-build` run on node 24 with `npm ci`, a lockfile-keyed cache, `npm run test` and `npm run build`.
- A broken type or a failing test fails the pipeline before the push reaches `main`.

## Proposed Implementation

- `.gitlab-ci.yml`: extend the stage list (`lint`, `test`, `build`), add the two jobs with `image: node:24`, `cache` on `app/node_modules` keyed by `app/package-lock.json`.
- `docs/contributing/ci-cd.md`: document the new jobs.

## Relevant Files

- `.gitlab-ci.yml` — the pipeline.
- `docs/contributing/ci-cd.md` — the job map.
- `app/package.json` — scripts the jobs call.

## Verification Procedure

- Pipeline green on a branch with the new jobs; a temporary type error fails `app-build` (spot check).

## Notes

- Node 24 matches `app/package.json` engines and the Vercel build.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `.gitlab-ci.yml` gained the `test` and `build` stages with `app-test` (`npm ci && npm run test`) and `app-build` (`npm ci && npm run build`) on node 24 and a lockfile-keyed cache; `docs/contributing/ci-cd.md` documents the jobs.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
