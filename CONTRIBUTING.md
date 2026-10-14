# Contributing to <Project>

Thank you for contributing to <Project>. This document is the single source of truth for how
we work.

## Quick reference

- **Branching:** Trunk-based + short feature branches (< 2 days). Branch naming:
  `feat/<scope>-<slug>`, `fix/<scope>-<slug>`, `refactor/<slug>`, `docs/<slug>`, `chore/<slug>`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/). Types: `feat`,
  `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`.
- **PRs:** Squash-merge by default; merge-commit only for mass-rename batches. Minimum 1
  approving review. MR template is mandatory.
- **Code style:** LF endings; formatting is machine-checked by `.editorconfig`. See
  `docs/agents/RULES.md` §Code style — language-specific rules come from the installed
  addons.
- **Naming:** see `docs/agents/RULES.md` §Naming.

## Commit format

```
<type>(<scope>): <subject>

<body>

<footer>
```

- `type`: see Quick reference.
- `scope`: project-specific — keep the list in `docs/agents/RULES.md` §Commits and
  `commitlint.config.js` in sync.
- `subject`: imperative mood, lowercase, no trailing dot.
- `body`: explain what and why (not how — the diff shows how).
- `footer`: `BREAKING CHANGE: ...` for breaking changes; `Closes #123` for issues.

## Pull-request checklist

Every PR must:

- [ ] Build without errors.
- [ ] Tests pass locally.
- [ ] Docs updated if public API or behaviour changed.
- [ ] The tracked record is closed: task `Status: Done` + `Resolution`, KI `Fixed`, DG
      `Closed` (when the PR closes tracked work).

## Code conventions

- Private fields: `_camelCase`.
- Constants: `PascalCase`.
- Public APIs: XML doc comments mandatory.
- Logging: use the project's logging wrapper (not raw framework logging) in application code.
- Nullability / language-specific rules: see the installed addons
  (`docs/agents/RULES.md` extended sections, `.editorconfig`).
- `async` methods: accept a `CancellationToken` parameter.

## Documentation

- Markdown only, repo-relative links.
- Architecture decisions go in `docs/development/architecture/adr/`.
- Feature docs go in `docs/development/architecture/features/`.
- Work items go in `docs/development/tasks/` (from `TASK_TEMPLATE.md`).
- Defects go in `docs/development/known_issues/` (one `KI-<OWNER>-<NNN>.md` per issue, from
  `KNOWN_ISSUE_TEMPLATE.md`).
- Delivery gaps go in `docs/development/delivery_gaps/` (one `DG-<OWNER>-<NNN>.md` per gap,
  from `DELIVERY_GAP_TEMPLATE.md`).
- Agentic-tool rules live in `docs/agents/RULES.md`.

## Questions?

Open an issue with the label `question` or ask in the team channel.
