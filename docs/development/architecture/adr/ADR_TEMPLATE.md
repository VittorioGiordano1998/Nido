---
id: ADR-<AREA>-<OWNER>-<NNN>
owner: <OWNER token from tools/git-identity.*>
status: Proposed
date: YYYY-MM-DD
accepted: null
deciders: []
superseded_by: null
---

# ADR Template

## ADR: <Title>

> Metadata is the frontmatter block above. `status` is one of Proposed, Accepted, Implemented,
> Deprecated, Superseded — a superseding decision goes in `superseded_by`, not in the status;
> dates are ISO (`YYYY-MM-DD`); an empty field is `null` (or `[]` for a list).
>
> ID scheme (RULES.md §ADR records): `<ADR>-<AREA>-<OWNER>-<NNN>` — the same owner-qualified
> scheme as tasks; `OWNER` from `tools/git-identity.*` makes every record globally unique per
> creator. `NNN` is a per-(area, owner) sequence. Filename
> (`ADR-<AREA>-<OWNER>-<NNN>-<slug>.md`) and `id` must match; the CI `records` job
> enforces it.
>
> Lifecycle (RULES.md §ADR records): records live in an `adr/<status>/` subfolder and move on
> every status change — `sh tools/scaffold.sh records move <ID> "<Status>"` performs the move,
> the field and the index together. A new decision starts as **Proposed** in
> `architecture/adr/proposed/`. Once approved it becomes **Accepted** (implementation
> tracked by a task) and moves to `architecture/adr/accepted/`; when that implementation
> lands, the record moves to `architecture/adr/implemented/`, and the `## Implementation`
> section below records what changed and how it was verified.
> Deprecated / Superseded records move to their subfolders. The folder placement is the
> lifecycle marker — `implemented/` means the decision is accepted AND implemented.

## Context

## Decision

## Consequences (positive / negative / neutral)

## Alternatives considered

## Implementation

[When the ADR moves to `implemented/`: what landed (code/docs/contracts), the implementing task
and commit, and how it was verified. Leave empty while the ADR is Proposed or Accepted.]

## Touch History

[Actions performed on this record (creation, acceptance, implementation, supersession...):

- who touched this record (if it is an agent: agent model/provider)
- when
- what has been done
]
