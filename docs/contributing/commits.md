# Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

- `feat` — new feature
- `fix` — bug fix
- `refactor` — code change that neither fixes a bug nor adds a feature
- `perf` — performance improvement
- `docs` — documentation only
- `test` — adding or correcting tests
- `chore` — build, tooling, no production code change
- `build` — build system or external dependencies
- `ci` — CI configuration
- `style` — formatting, missing semicolons, etc.
- `revert` — revert a previous commit

## Examples

```
feat(api): add user endpoint

fix(store): clear cache on logout

refactor(core)!: rename Entity → Node

BREAKING CHANGE: Entity type removed. Update external references to Node.
```

## Breaking changes

Use `!` after the type/scope and add a `BREAKING CHANGE:` footer. This triggers a major
version bump per SemVer.
