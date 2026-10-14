# Pull Requests

## Process

1. Branch from `main`: `feat/<scope>-<slug>` or `fix/<scope>-<slug>`.
2. Keep PRs small (< 2 days of work, < 400 lines of diff).
3. Fill out the MR template fully (including the `Record` section — claimed task/issue and
   which index was updated).
4. Request review from the CODEOWNERS for the paths you touched.
5. Squash-merge by default; merge-commit only for mass-rename batches.

## Required checks

- Pipeline green: the `lint` stage always runs; addon-provided `test`/`build` stages run
  when their gate is set (see the addon docs).
- Build without errors.
- Tests pass locally.
- Docs updated if public API or behaviour changed.

## Merge rules

- At least 1 approving review.
- PR title must follow Conventional Commits format.
- `main` is protected: an MR to `main` requires the pipeline to pass before merge
  (server-side GitLab setting).
