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
| 1     | Project Identity       | Implemented for the fields the accepted schema defines       |
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
```

`vahu init` is the only command that creates `.vahu/project.json`. With flags it
is non-interactive and needs `--yes` to write a new file or `--force` to replace
an existing one. Without flags in a terminal it asks one question per missing
answer, offering the current value (or a derived default) in brackets.

`vahu identity` prints the captured identity and its approval status.
`vahu identity approve` records an approval and requires a named approver.

### Field mapping

The accepted configuration schema (`schemaVersion` 1.0.0) defines these Project
Identity fields. Stage 1 captures exactly these and nothing else:

| Roadmap requirement    | Configuration field   | Behaviour                                      |
| ---------------------- | --------------------- | ---------------------------------------------- |
| Project name           | `project.name`        | Required                                       |
| Short description      | `project.description` | Required                                       |
| Project purpose        | `project.purpose`     | Required                                       |
| Intended users         | `project.targetUsers` | Required, comma-separated list                 |
| Product category       | `project.type`        | Required, one of the schema's project types    |
| Documentation language | `project.languages`   | Defaults to `en`, comma-separated list         |
| Constraints            | `project.constraints` | Optional, comma-separated list                 |
| Identifier             | `project.slug`        | Derived from the name, editable before writing |

Every section the schema also defines is written with an honest starting value,
not a guess: `identity` is `pending`, `brand` is `not-applicable`,
`design-system` is `not-started`/`none`, `repositories` is `monorepo`,
`technology` is empty, `agents` is `generic`, and `readiness` is `incomplete`.

### Not captured yet

Four roadmap Stage 1 items have no field in the accepted schema: the long
description, project status and lifecycle, repository locations and ownership,
and non-goals. Adding them changes the public configuration file format, which
[P1-14](../../packages/framework/core/engineering-decisions.md) requires to
happen through an accepted decision record and a schema version with a
migration. They are therefore deferred, not silently approximated:

| Item                         | Blocker                     |
| ---------------------------- | --------------------------- |
| Long description             | Schema 1.1.0 field plus ADR |
| Project status and lifecycle | Schema 1.1.0 field plus ADR |
| Repository locations/owners  | Schema 1.1.0 field plus ADR |
| Non-goals                    | Schema 1.1.0 field plus ADR |

`project.constraints` is not used as a substitute for non-goals, and
`repositories.notes` is not filled with invented locations.

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

| Area                                 | Test file                                         |
| ------------------------------------ | ------------------------------------------------- |
| Slug derivation and answers          | `packages/core/src/onboarding.test.ts` (15 tests) |
| Safe writes and refusal to overwrite | `packages/core/src/config.test.ts`                |
| Init, approval, and validation gate  | `apps/cli/tests/cli.test.ts`                      |

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
| Every Stage 1 roadmap field is captured            | Partial | Four fields need a schema 1.1.0 decision (see above)       |
| Stages 2–8                                         | Not met | Not started                                                |

## Non-goals

Phase 2 Stage 1 does not generate brand assets, design systems, technology
profiles, agent adapters, documentation, or a readiness report, and it adds no
hosted service. Those belong to later stages and phases, and each consequential
one needs explicit approval before implementation.
