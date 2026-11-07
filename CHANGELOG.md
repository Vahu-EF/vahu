# Changelog

All notable changes to VAHU are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning follows
[Semantic Versioning](https://semver.org/).

## Unreleased — Phase 3 agents

### Added

- Canonical agent definition schema (`packages/schemas/src/agent.ts`) with a
  generated `agent.schema.json`: identity, instructions, scoped rules, skills,
  commands, workflows, tools, context, approvals, and adapter compatibility.
- `@vahu-ef/adapters` package with the `AgentAdapter` interface and a
  deterministic `generic` adapter that renders provider-neutral `AGENTS.md`
  Markdown.
- `AGENT-IMPLEMENTER` and `AGENT-REVIEWER` definitions under
  `packages/framework/agents/`, parsed by the adapter tests so an invalid
  definition fails CI.
- ADR-0008 and `architecture/specifications/phase-3.md`.

### Not included

- Codex, Claude Code, and Gemini adapters; no provider is claimed compatible.
- File generation, synchronization, conflict detection, and diff preview.
- Any execution of agent tools or workflows.

## Unreleased — Phase 2 Project Identity

### Added

- Onboarding stages 2–8: `vahu brand`, `vahu design` and `vahu design approve`,
  `vahu technology`, `vahu repositories`, `vahu foundation`, and
  `vahu readiness [--record]`, backed by tested core logic in
  `packages/core/src/stages.ts` and `packages/core/src/foundation.ts`.
- Brand capture enforces a reason for `not-applicable` and an asset for
  `approved`; design approval requires a source and a path; foundation reports
  only facts detected from files and writes nothing.

- Project configuration schema `1.1.0`, adding `project.longDescription`,
  `project.lifecycle`, `project.nonGoals`, and `repositories.locations`
  additively; `project.schema.json` regenerated.
- `migrateProjectConfig` in `@vahu-ef/schemas`: validates a `1.0.0` file before
  migrating, adds only the defaulted collections, and rejects unsupported
  versions. `loadProjectConfig` reports `migratedFrom`, and `validate` adds the
  non-blocking `SCHEMA_1_0_0_NOT_MIGRATED` recommendation.
- `vahu migrate`, which previews a schema migration and rewrites only with
  `--write`.
- `vahu init` captures long description, lifecycle, non-goals, and repository
  locations (flags and prompts), and writes schema `1.1.0`.
- Examples migrated to schema `1.1.0`.
- `vahu init` captures Project Identity interactively or through flags and writes
  a schema-valid `.vahu/project.json` without recording an approval.
- `vahu identity` shows the identity and its approval status;
  `vahu identity approve --by "Name"` records an explicit approval with a date.
- `saveProjectConfig` refuses to replace an existing configuration unless the
  caller passes `overwrite`, and `vahu init` prints a change preview first.
- Onboarding logic in `@vahu-ef/core` (`buildProjectConfig`, `mergeIdentity`,
  `approveIdentity`, `changedConfigPaths`, `suggestSlug`) with 15 tests, plus 3
  tests for safe writes and 6 CLI tests for the flow.
- `architecture/specifications/phase-2.md` records the stage status and the field
  mapping for every Stage 1 roadmap item.

### Accepted

- ADR-0007 (schema 1.1.0 for Project Identity), accepted by the VAHU project
  owner on 2026-11-07.

### Not included

- Design-system token analysis, gap reporting, and generated design-system
  proposals (the rest of Stage 3); the CLI records and approves an existing
  system.
- A CLI flag for repository `owner`; the configuration field exists.
- Stored engineering-foundation facts; `vahu foundation` inspects but writes
  nothing.
- Automatic schema upgrades: a `1.0.0` file is read and reported, and is only
  rewritten by `vahu migrate --write`.

## Unreleased — Phase 1 standards

### Added

- Canonical pages for P1-02 and P1-04 through P1-13, plus P1-15, each with the
  content metadata required by the content model.
- `validateStandards` in `@vahu-ef/core` with 16 tests covering standard-page
  metadata, section order, rule IDs and fields, relative links, and the ADR
  index.
- `pnpm validate:standards`, wired into `pnpm check` and the CI `verify` job.
- Standards status tables updated in the Phase 1 specification and framework
  indexes.
- Content model: `@vahu-ef/schemas` content item schema and
  `content.schema.json`; `discoverContent`, `validateContentModel`, and
  `composeContent` in `@vahu-ef/core`, covered by 19 tests.
- The content model and composition contract documented in
  `packages/framework/CONTENT_MODEL.md`, applied to all 15 standard pages.
- `validateFramework` runs page, content-model, and decision-index checks in one
  gate (`pnpm validate:standards`).
- Phase roadmap added at `architecture/specifications/roadmap.md`.
- Workspace-boundary validation moved into `@vahu-ef/core` with 7 tests; the
  repository script is now a thin entry point.
- Verification lists in P1-01 and P1-14 now separate shipped checks from planned
  ones, per P1-15-R7.

### Accepted

- P1-02 through P1-13 and P1-15, accepted by the VAHU project owner on
  2026-11-07 at version 0.1.0 (0.1.1 for P1-15), with an approval record on each
  page. Phase 1 is complete.

### Not included

- The per-standard checks each page still lists as planned in its `Verification`
  section.
- Application of the composition rules to a real project configuration by a
  command.

## Unreleased — Phase 0 foundation

### Added

- Initial pnpm/TypeScript monorepo.
- Versioned Zod project configuration schema and generated JSON Schema.
- Reusable core validation and readiness logic.
- Working `vahu --version`, `--help`, `doctor`, and `validate` commands.
- Schema, validation, and CLI tests.
- Documentation, architecture decisions, examples, templates, and framework
  boundaries.
- CI, lint, security, release-preparation, and manual Pages workflows.
- Apache License 2.0 text.

### Not included

- npm publication.
- GitHub Releases or standalone executables.
- Complete engineering standards.
- Technology profiles.
- Working agent adapters.
- Onboarding wizard.
- Published website.
