# ADR-0007: Extend the project configuration to schema 1.1.0 for Project Identity

- **Status:** Accepted
- **Date:** 2026-11-07
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Supersedes:** None
- **Superseded by:** None

## Context

Phase 2 Stage 1 is implemented, but four of its required Project Identity items
have nowhere to go in the configuration:

- the long description,
- project status and lifecycle,
- repository locations and ownership,
- non-goals.

[`phase-2.md`](../specifications/phase-2.md) records them as blocked rather than
approximating them with `project.constraints` or `repositories.notes`. That was
the right call for a single change, but the fields are part of the approved
Phase 2 scope, and onboarding cannot claim Stage 1 complete while they are
missing.

Adding them changes the public contract in `.vahu/project.json`. P1-14-R7
requires an ADR for a file-format change, and
[ADR-0003](ADR-0003-configuration-contract.md) requires a version bump with an
explicit migration: "silently accepting a different version is not allowed."
This ADR is that decision and that migration plan.

## Decision

Bump the project configuration to **schema `1.1.0`** as an additive minor
version, and ship a one-step migration from `1.0.0`.

### Fields added

All new fields are optional or defaulted, so every valid `1.0.0` document is a
valid `1.1.0` document.

| Field                     | Shape                                                          | Why                                                        |
| ------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| `project.longDescription` | optional non-empty string                                      | A short `description` cannot hold positioning or context   |
| `project.lifecycle`       | optional enum: `planned`, `active`, `maintenance`, `archived`  | Project status without inventing a release process         |
| `project.nonGoals`        | string array, default `[]`                                     | Explicit exclusions, kept distinct from constraints        |
| `repositories.locations`  | array, default `[]`, of `{ name, role?, path?, url?, owner? }` | Repository locations and ownership for monorepo and hybrid |

`repositories.locations[]` requires `name` and at least one of `path` or `url`;
`role` is one of `primary`, `package`, `service`, `documentation`, `other`. The
objects stay strict, like the rest of the configuration.

`project.lifecycle` is deliberately a small fixed set. A free-form status string
would be unvalidatable, and a release-management vocabulary belongs to a later
phase, not to Project Identity.

### Schema construction without duplication

The `1.1.0` schema is built from the `1.0.0` definitions, not copied:

- extract `projectV1_0_0` and `repositoriesV1_0_0` object schemas;
- `projectV1_1_0 = projectV1_0_0.extend({ longDescription, lifecycle, nonGoals })`;
- `repositoriesV1_1_0 = repositoriesV1_0_0.extend({ locations })`;
- compose the full `1.0.0` schema (literal version `1.0.0`, base objects) and the
  `1.1.0` schema (literal version `1.1.0`, extended objects) from those pieces.

Field lists therefore exist once. A future `1.2.0` extends `1.1.0` the same way.

### Migration

A new `packages/schemas/src/migrations.ts`:

```ts
migrateProjectConfig(input: unknown):
  | { ok: true; config: ProjectConfig; from: '1.0.0' }
  | { ok: false; issues: ConfigIssue[] }
```

Steps:

1. Read `schemaVersion` from the input. `1.1.0` is parsed as-is; `1.0.0` is
   validated against the `1.0.0` schema **before** migration, so a broken file is
   reported, never silently repaired; any other version is rejected with the
   supported list.
2. Apply `v1_0_0 → v1_1_0`: set `schemaVersion: '1.1.0'`, add
   `project.nonGoals: []` and `repositories.locations: []`. Nothing is invented:
   `longDescription` and `lifecycle` stay absent when they were not provided.
3. Parse the result with the `1.1.0` schema as a self-check.
4. Keep migrations in a version-keyed registry so later steps compose
   (`1.0.0 → 1.1.0 → 1.2.0`).

The transform is pure and does no file I/O. Key order is preserved, so a migrated
file still starts with `schemaVersion`.

### Read, write, and command behaviour

- `parseProjectConfig` remains the strict latest-version parser; `1.0.0` input is
  not accepted by it.
- `loadProjectConfig` in `@vahu-ef/core` migrates `1.0.0` in memory and returns
  `valid` with `migratedFrom: '1.0.0'`, so existing projects keep working.
- `validate` adds one **non-blocking** recommendation,
  `SCHEMA_1_0_0_NOT_MIGRATED`: the file is readable but predates the current
  contract.
- New `vahu migrate [--path <directory>] [--write]` prints the version change and
  the fields it would add; only `--write` rewrites the file, through the existing
  `saveProjectConfig(..., { overwrite: true })` path.
- `vahu init` writes `schemaVersion: '1.1.0'` and accepts the new fields
  (`--long-description`, `--lifecycle`, `--non-goals`, repository locations);
  flag spelling is chosen in implementation.
- `packages/schemas/project.schema.json` is regenerated and committed; no
  `$schema` URL is introduced, per ADR-0003.

### Compatibility promise

- Writers emit only `1.1.0`.
- `1.0.0` documents stay readable through migration for the rest of the `0.x`
  series.
- Older CLI versions reject a `1.1.0` file loudly because the version literal is
  checked. That is intended: a reader that does not know the new fields must not
  guess at them.
- `1.1.0` is additive, so the change is a minor version, not `2.0.0`.

## Consequences

Positive:

- Phase 2 Stage 1 can capture every item the approved scope lists, with no
  overloaded or invented fields.
- Existing projects are not broken: their files are readable and they keep a
  documented path to the new version.
- The schema keeps one definition per field and one visible version history.

Negative and open:

- Two schema versions and a migration registry must be tested for as long as
  `1.0.0` is supported.
- A project that never runs `vahu migrate` keeps a file that is read, not
  rewritten, so its file and its validated meaning differ until it is migrated.
- Onboarding gains four prompts and a slightly longer identity review.
- The migration does not backfill `longDescription` or `lifecycle`; a project
  that wants them must provide them.

## Alternatives considered

- **Store non-goals in `constraints` and locations in `repositories.notes`.**
  Rejected: constraints and non-goals have different review consequences, and a
  free-text notes field cannot be validated or read by tooling.
- **Accept `1.0.0` and `1.1.0` forever with no migration.** Rejected by
  ADR-0003: an ambiguous version with no migration path is exactly what the
  version field exists to prevent.
- **Put the extra identity data in a sidecar file.** Rejected: project identity
  would then have two sources of truth.
- **Bump the major version.** Rejected: no field is removed, renamed, or
  re-typed, so a major bump would overstate the break.

## Links

- Related ADR: [ADR-0003](ADR-0003-configuration-contract.md) (one versioned
  contract; a version bump needs a migration)
- Affected files or packages: `packages/schemas/src/project.ts`,
  `packages/schemas/src/migrations.ts`, `packages/schemas/project.schema.json`,
  `packages/core/src/config.ts`, `packages/core/src/validate.ts`,
  `apps/cli/src/commands/init.ts`, `apps/cli/src/commands/identity.ts`
- Related specifications: [`phase-2.md`](../specifications/phase-2.md) Stage 1,
  [roadmap Phase 2](../specifications/roadmap.md#phase-2--project-identity--onboarding)
- Related standards: [P1-07: Configuration](../../packages/framework/core/configuration.md),
  [P1-09: Data design](../../packages/framework/core/data-design.md)

## Approval

- **Approved by:** VAHU project owner
- **Approved on:** 2026-11-07
- **Review date:** None

## Notes

Implementation order after acceptance, as one change:

1. Extract the shared object schemas and add the four fields behind the `1.1.0`
   literal; regenerate the JSON Schema.
2. Add `migrateProjectConfig` with tests for a valid `1.0.0` file, a broken
   `1.0.0` file, an unknown version, and round-trip stability.
3. Teach `loadProjectConfig` and `validate` about `migratedFrom` and the
   non-blocking recommendation; test both.
4. Add `vahu migrate`, and capture the new fields in `vahu init`; extend the CLI
   tests through the full init → approve → validate path.
5. Update `phase-2.md`, the configuration guide, the CLI reference, the roadmap
   status table, and the changelog; mark the Stage 1 gap closed.

Questions resolved on acceptance:

- The lifecycle set stays `planned`, `active`, `maintenance`, `archived`.
- `repositories.locations[].url` accepts any valid URL; no scheme restriction is
  enforced by the contract.

## Implementation record

Accepted and implemented on 2026-11-07, with the vocabulary unchanged from the
proposal (`planned`, `active`, `maintenance`, `archived`) and `https` still
optional at the contract level: any valid URL is accepted today.

- `packages/schemas/src/project.ts` composes the `1.0.0` and `1.1.0` schemas from
  the same field definitions, and `project.schema.json` was regenerated.
- `packages/schemas/src/migrations.ts` validates before migrating, adds only the
  defaulted collections, and re-parses the result.
- `loadProjectConfig` reports `migratedFrom`, and `validate` adds the
  non-blocking `SCHEMA_1_0_0_NOT_MIGRATED` recommendation.
- `vahu migrate` previews by default and writes only with `--write`;
  `vahu init` captures the new fields.
- Covered by `project.test.ts` (14 tests), `validate.test.ts` (8), onboarding
  tests, and CLI tests for capture and migration.
