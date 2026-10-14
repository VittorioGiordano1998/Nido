---
description: Commit working-tree changes, split into one commit per area
---

# /commit

Commit the uncommitted changes in the working tree. If the changes span several areas, tasks,
or domains, split them into separate Conventional Commits — one commit per logical change —
and report the full plan to the user **before** committing anything.

## Workflow

1. **Inspect.** Run `git status --porcelain` (this shows untracked files too) and
   `git diff --stat`. Note anything the user has already staged and treat it as part of the
   working tree for splitting purposes.
2. **Split.** Group the changed files by area, task, or domain. Rules of thumb:
   - One group per distinct domain — e.g. `docs/agents/`, `docs/development/known_issues/`,
     `docs/development/plans/`, a single feature's code — using the scope list in
     `docs/agents/RULES.md` (§Commits) and the path conventions in the repo.
   - Files that belong to one logical change stay together, even across directories
     (e.g. `CHANGELOG.md` updated for the same work).
   - A lone file or a single area collapses to one commit. Never split one logical change,
     never merge unrelated ones.
3. **Report — stop before committing.** Present the full plan to the user: for each proposed
   commit, the Conventional Commit name (`<type>(<scope>): <subject>`), a one-line
   description of what and why, and the list of files it includes. Wait for approval. The
   user may edit names, merge groups, or re-split before anything is staged.
4. **Commit group by group** after approval, in order:
   - `git add -- <files of that group only>`
   - `git commit -m "<type>(<scope>): <subject>"`, adding a `-m` body explaining what and why
     when the change is not trivial. Subject in imperative mood, lowercase, no trailing dot.
   - Verify each commit stages only its own files (`git show --stat --oneline HEAD`).
5. **Report the result**: the commit hashes with subjects, and any files left uncommitted.

## Conventions

- Use only the types and scopes listed in `docs/agents/RULES.md` §Commits.
- Never commit secrets, build artifacts, or files the user asked to keep out; never mix two
  unrelated changes into one commit.
- If a hook rejects a commit, fix the problem and retry — do not bypass hooks or amend a
  failed commit.
