# Changelog

All notable changes to VAHU are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning follows
[Semantic Versioning](https://semver.org/).

## Unreleased — Phase 2 Project Identity

### Added

- `vahu init` captures Project Identity interactively or through flags and writes
  a schema-valid `.vahu/project.json` without recording an approval.
- `vahu identity` shows the identity and its approval status;
  `vahu identity approve --by "Name"` records an explicit approval with a date.
- `saveProjectConfig` refuses to replace an existing configuration unless the
  caller passes `overwrite`, and `vahu init` prints a change preview first.
- Onboarding logic in `@vahu-ef/core` (`buildProjectConfig`, `mergeIdentity`,
  `approveIdentity`, `changedConfigPaths`, `suggestSlug`) with 15 tests, plus 3
  tests for safe writes and 6 CLI tests for the flow.
- `architecture/specifications/phase-2.md` records the stage status, the field
  mapping, and the Stage 1 fields that need a schema 1.1.0 decision.

### Not included

- Brand, design system, design approval, technology selection, repository
  strategy, engineering foundation, and readiness onboarding stages.
- Long description, lifecycle, repository locations, and non-goals capture; the
  accepted schema has no fields for them, so they need a decision record and a
  versioned schema change.

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
