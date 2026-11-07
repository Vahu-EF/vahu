# Phase 2 specification — Project Identity & Onboarding

- **Status:** In Progress — Stage 1 implemented; Stages 2–8 not started
- **Depends on:** Phase 0 foundation, accepted Phase 1 standards, approved Phase 2 scope
- **Owner approval:** Phase 2 approved by the VAHU project owner on 2026-11-07
- **Canonical for:** the onboarding implementation contract

## Goal

Give a project a safe, approval-based path from "empty directory" to a valid
`.vahu/project.json` that records what the project is, and never records an
approval, a brand decision, a design system, or a readiness claim that a person
did not make.

## Scope

The approved scope is the eight onboarding stages in the Phase 2 section of
[the roadmap](roadmap.md#phase-2--project-identity--onboarding). This document
does not restate them; it records how each stage is implemented, what it writes,
and what remains.

## Stage status

| Stage | Name                   | State                                                        |
| ----- | ---------------------- | ------------------------------------------------------------ |
| 1     | Project Identity       | Implemented; every roadmap field is captured                 |
| 2     | Brand identity         | Not started                                                  |
| 3     | Design system          | Not started                                                  |
| 4     | Design approval        | Not started; the readiness rule exists from Phase 0          |
| 5     | Technology selection   | Not started                                                  |
| 6     | Repository strategy    | Not started; the configuration accepts a strategy and notes  |
| 7     | Engineering foundation | Not started                                                  |
| 8     | Project readiness      | Not started as a report; Phase 0 readiness rules still apply |

## Stage 1 — Project Identity

### Commands

```bash
vahu init [--path <directory>] [--name <name>] [--slug <slug>] ... [--yes] [--force]
vahu identity [--path <directory>] [--json]
vahu identity approve [--path <directory>] --by "Your Name" [--json]
vahu migrate [--path <directory>] [--write] [--json]
```

`vahu init` is the only command that creates `.vahu/project.json`. With flags it
is non-interactive and needs `--yes` to write a new file or `--force` to replace
an existing one. Without flags in a terminal it asks one question per missing
answer, offering the current value (or a derived default) in brackets.

`vahu identity` prints the captured identity and its approval status.
`vahu identity approve` records an approval and requires a named approver.

### Field mapping

The accepted configuration schema (`schemaVersion` 1.1.0, per
[ADR-0007](../decisions/ADR-0007-project-identity-schema-1-1-0.md)) defines these
Project Identity fields. Stage 1 captures exactly these and nothing else:

| Roadmap requirement      | Configuration field       | Behaviour                                        |
| ------------------------ | ------------------------- | ------------------------------------------------ |
| Project name             | `project.name`            | Required                                         |
| Short description        | `project.description`     | Required                                         |
| Long description         | `project.longDescription` | Optional, blank is omitted                       |
| Project purpose          | `project.purpose`         | Required                                         |
| Intended users           | `project.targetUsers`     | Required, comma-separated list                   |
| Product category         | `project.type`            | Required, one of the schema's project types      |
| Project status/lifecycle | `project.lifecycle`       | Optional: planned, active, maintenance, archived |
| Repository locations     | `repositories.locations`  | Optional, `name=path` or `name=https://…`        |
| Documentation language   | `project.languages`       | Defaults to `en`, comma-separated list           |
| Constraints              | `project.constraints`     | Optional, comma-separated list                   |
| Non-goals                | `project.nonGoals`        | Optional, comma-separated list                   |
| Identifier               | `project.slug`            | Derived from the name, editable before writing   |

Every section the schema also defines is written with an honest starting value,
not a guess: `identity` is `pending`, `brand` is `not-applicable`,
`design-system` is `not-started`/`none`, `repositories` is `monorepo`,
`technology` is empty, `agents` is `generic`, and `readiness` is `incomplete`.

### Schema version and migration

[ADR-0007](../decisions/ADR-0007-project-identity-schema-1-1-0.md) was accepted on
2026-11-07 and implemented in the same change. The configuration moved from
`1.0.0` to `1.1.0` additively: `longDescription`, `lifecycle`, `nonGoals`, and
`repositories.locations` were added, and no field was renamed, removed, or
re-typed.

A `1.0.0` file is validated against the `1.0.0` schema before it is migrated, so
a broken file is reported rather than repaired. Migration adds only
`project.nonGoals: []` and `repositories.locations: []`; fields the file did not
hold stay absent. `vahu validate` reads such a file without blocking and adds a
`SCHEMA_1_0_0_NOT_MIGRATED` recommendation; `vahu migrate` previews the change
and writes it only with `--write`.

### Approval

Identity approval is a separate, explicit act. `vahu init` always writes
`identity.status: "pending"`, including when it replaces an approved identity, so
changing the identity revokes the earlier approval. Only `vahu identity approve`
writes `approvedBy` and `approvedAt`, and it refuses to run without a non-empty
approver name. `vahu validate` blocks while the identity is pending
(`IDENTITY_NOT_APPROVED`).

### Safety rules

- The change preview is printed before any write: the count and paths of changed
  fields, or a "new configuration" summary.
- An existing file is never replaced without `--force` or an explicit `y` answer.
- A file that is not valid JSON or not schema-valid is never replaced by `init`;
  the command stops and asks for the file to be fixed.
- The configuration holds no secrets, and `init` asks for none.

### Resumability

Re-running `vahu init` prefills every answer from the current configuration, so a
half-finished identity can be completed later or corrected without a draft file.
There is no separate partial-onboarding state to keep in sync with the
configuration.

## Validation

The stage is covered by automated tests:

| Area                                   | Test file                                         |
| -------------------------------------- | ------------------------------------------------- |
| Slug derivation and answers            | `packages/core/src/onboarding.test.ts` (18 tests) |
| Safe writes, reading, and migration    | `packages/core/src/config.test.ts` (6 tests)      |
| Schema and migration                   | `packages/schemas/src/project.test.ts` (14 tests) |
| Readiness and migration recommendation | `packages/core/src/validate.test.ts` (8 tests)    |
| Init, approval, migration, and gate    | `apps/cli/tests/cli.test.ts` (14 tests)           |

The interactive flow was also exercised once through a real terminal: every
prompt accepted a value or its default, the preview printed, the file was
created, `vahu validate` reported `IDENTITY_NOT_APPROVED`, and `vahu identity
approve` cleared it. Interactive behaviour is not covered by an automated test.

## Acceptance

| Criterion                                          | State   | Evidence                                                   |
| -------------------------------------------------- | ------- | ---------------------------------------------------------- |
| Identity is captured through a guided flow         | Met     | `vahu init`, interactive and flag-driven                   |
| Identity is a valid `.vahu/project.json`           | Met     | `buildProjectConfig` runs the schema parser                |
| Nothing is approved on the user's behalf           | Met     | `init` writes `pending`; approval needs `--by`             |
| No file is overwritten without preview and consent | Met     | `saveProjectConfig` refuses unless `overwrite` is explicit |
| Onboarding can be resumed                          | Met     | Re-running `init` prefills from the configuration          |
| Every Stage 1 roadmap field is captured            | Met     | Schema 1.1.0 per ADR-0007; `init` flags and prompts        |
| Older configurations stay readable                 | Met     | 1.0.0 migration, validated before transforming             |
| Stages 2–8                                         | Not met | Not started                                                |

## Non-goals

Phase 2 Stage 1 does not generate brand assets, design systems, technology
profiles, agent adapters, documentation, or a readiness report, and it adds no
hosted service. Those belong to later stages and phases, and each consequential
one needs explicit approval before implementation.
