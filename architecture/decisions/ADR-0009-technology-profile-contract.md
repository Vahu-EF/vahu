# ADR-0009: Define technology profiles as validated JSON with explicit composition

- **Status:** Accepted
- **Date:** 2026-11-07
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Supersedes:** None
- **Superseded by:** None

## Context

Phase 4 asks for modular, version-aware technology profiles that apply practices
without tying VAHU to one stack. The repository reserved a single canonical
location, `packages/framework/technology-profiles/`, but had only a prose
template: no schema, no validation, and no way to tell whether two profiles could
be combined.

A profile format is a contract, so P1-14-R7 requires this record.

## Decision

Represent profiles as **JSON** validated by `profile.schema.json`, and make
selection and composition explicit.

### Profile fields

- `id` (`PROFILE-POSTGRESQL`), `name`, `description`, `version`, `schemaVersion`.
- `category`: backend, frontend, mobile, database, infrastructure, api, testing.
- `technology` — the value a project records in `technology`, plus
  `supportedVersions`.
- `projectTypes` — the project types the profile applies to, or `all`.
- `prerequisites`, `related`, and `compatibility.conflictsWith` — identifiers of
  other profiles.
- Guidance lists: architecture, structure, conventions, testing, security,
  documentation, tooling, and checks.

### Selection and composition

- A profile applies only when the project's technology selection contains its
  `technology` **and** its `projectTypes` includes the project type. There is no
  default profile and no fallback.
- Two selected profiles conflict when either declares the other in
  `conflictsWith`. The evaluator reports the profile that declared the conflict
  and the one it conflicts with; it never picks a winner.
- A selected prerequisite that is not selected is reported, not silently
  satisfied.
- A technology with no covering profile is reported as
  `TECHNOLOGY_PROFILE_UNKNOWN`, not treated as an error in the project.

### Validation

`pnpm validate:profiles` checks schema validity, duplicate identifiers, unknown
prerequisites/related/conflicts, self-reference, and prerequisite cycles. The
logic lives in `@vahu-ef/core` (`profiles.ts`) and is covered by tests.

## Consequences

Positive:

- Profiles are machine-readable, independently reusable, and composable with
  explained conflicts.
- A broken profile fails CI instead of being skipped.
- Adding a profile is additive: one JSON file plus the gate.

Negative and open:

- JSON is less pleasant to author than Markdown; the template carries the prose
  guidance.
- Only three profiles exist; frontend, mobile, infrastructure, and API families
  are not written.
- The evaluator is not called by any CLI command yet; a project cannot ask
  `vahu` which profiles apply.
- Profile guidance is not composed into project content or agent instructions.

## Alternatives considered

- **Markdown profiles with a fixed heading layout.** Rejected: conflict and
  prerequisite checks would parse prose, and fields like supported versions could
  not be validated.
- **Profiles embedded in the project configuration.** Rejected: profiles are
  reusable framework content with their own lifecycle; the configuration records
  a selection, not the profile.
- **A single global profile set applied to every project.** Rejected: it makes
  one stack the default, which the framework explicitly avoids.

## Links

- Related ADR: [ADR-0003](ADR-0003-configuration-contract.md) (one versioned
  contract owned by `packages/schemas`)
- Affected files or packages: `packages/schemas/src/profile.ts`,
  `packages/framework/technology-profiles/`, `packages/core/src/profiles.ts`
- Related specifications: [`phase-4.md`](../specifications/phase-4.md)

## Approval

- **Approved by:** VAHU project owner
- **Approved on:** 2026-11-07
- **Review date:** None

## Notes

Implementation record: schema and generated JSON Schema, three profiles
(`PROFILE-NODE-BACKEND`, `PROFILE-POSTGRESQL`, `PROFILE-VITEST`), catalog
validation and selection evaluation in core, the `validate:profiles` gate wired
into `pnpm check`, and tests for duplicates, unknown references, cycles,
conflicts, and missing prerequisites.
