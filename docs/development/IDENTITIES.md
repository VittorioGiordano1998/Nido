# Record owner identities

Every task / known-issue / delivery-gap / plan record carries the creator's identity in its ID
(RULES.md, Task-first workflow):

```
<KIND>-<AREA>-<OWNER>-<NNN>
```

`OWNER` is derived by `tools/git-identity.*` from `git config user.name` (normalized:
uppercase, non-alphanumeric stripped), falling back to the current OS user when git is not
configured.

## Canonical tokens

| OWNER | Person | Canonical `git config user.name` |
|---|---|---|

## Rules

- Set the same `git config user.name` on every machine you work from — the token is derived
  from it, and a different name means a different OWNER (and a different record namespace).
- Do not hand-edit an OWNER token; always run `tools/git-identity.*`. The `/new-task`,
  `/new-issue` and `/new-dg` commands do this for you.
- When two people share a machine or account, the OS-user fallback is ambiguous — configure
  git `user.name` so the token resolves to the right person.
