# Phase 2 specification — Project Identity & Onboarding

- **Status:** In Progress — Stages 1, 2, 4, 5, 6, 7, 8 implemented; Stage 3 partial
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

| Stage | Name                   | State                                                            |
| ----- | ---------------------- | ---------------------------------------------------------------- |
| 1     | Project Identity       | Implemented; every roadmap field is captured                     |
| 2     | Brand identity         | Implemented: capture, statuses, assets, and reasons              |
| 3     | Design system          | Partial: recording and approval, no token analysis or generation |
| 4     | Design approval        | Implemented: approval needs a source and a path                  |
| 5     | Technology selection   | Implemented: per-area selection, no profile catalog yet          |
| 6     | Repository strategy    | Implemented: strategy, notes, locations, and optional owners     |
| 7     | Engineering foundation | Implemented as inspection; detected facts are not stored         |
| 8     | Project readiness      | Implemented: report and opt-in record of status and time         |

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

## Stages 2–8 — other onboarding stages

Every command below requires an existing, schema-valid configuration. Each one
prints the section it writes and the paths it changed, and writes through
`saveProjectConfig` with an explicit overwrite because the change is the command's
purpose.

### Stage 2 — Brand identity

```bash
vahu brand --status not-applicable --notes "Internal service with no public brand."
vahu brand --status approved --logo assets/logo.svg --colors "#0b5fff" --typography "Inter"
```

`not-applicable` requires a recorded reason, and `approved` requires at least one
asset reference, so a project cannot claim a brand it has not supplied. The
command records references only; it never invents meanings, colors, or claims.

### Stages 3 and 4 — Design system and approval

```bash
vahu design --status pending-approval --source existing --path docs/design-system.md
vahu design approve
```

Approval is refused unless the design system has an `existing` or `generated`
source **and** a path, which is the same condition the readiness rules check.
Marking it `not-applicable` clears the source and path.

This is partial against the roadmap: token inspection, gap analysis, and
proposing a new design system are not implemented, and no design system is ever
marked approved automatically.

### Stage 5 — Technology selection

```bash
vahu technology --area backend --add "node, postgresql"
vahu technology --area backend --remove "node"
```

Selection is per area and does not assume a stack. The technology-profile catalog
belongs to Phase 4; for now a value is a recorded name, not a validated profile.

### Stage 6 — Repository strategy

```bash
vahu repositories --strategy hybrid --notes "API and docs live apart." \
  --location api=. --location docs=https://github.com/example/docs
```

Strategy, notes, locations, and optional per-location owners are captured. Use
`--owner name=owner` once per repository location; assignments must name an
existing location, and malformed or unknown assignments are rejected without
writing.

```bash
vahu repositories --path . --location api=apps/api --owner api=platform
vahu repositories --path . --owner docs=documentation-team
```

### Stage 7 — Engineering foundation

```bash
vahu foundation --path .
```

Inspects `package.json` scripts and package manager, lockfiles, CI workflows,
documentation locations, and an environment example. Everything printed is
labelled as detected from files, and nothing is written: storing foundation facts
would need a schema version of its own.

### Stage 8 — Project readiness

```bash
vahu readiness
vahu readiness --record
```

The report prints blocking issues and recommendations with their codes. `--record`
stores the computed status and the check time; it cannot make a project ready,
because the status is derived from the same rules. The command exits with status
`1` while a blocking issue remains.

## Validation

The stage is covered by automated tests:

| Area                                               | Test file                                         |
| -------------------------------------------------- | ------------------------------------------------- |
| Slug derivation and answers                        | `packages/core/src/onboarding.test.ts` (18 tests) |
| Safe writes, reading, and migration                | `packages/core/src/config.test.ts` (6 tests)      |
| Schema and migration                               | `packages/schemas/src/project.test.ts` (14 tests) |
| Readiness and migration recommendation             | `packages/core/src/validate.test.ts` (8 tests)    |
| Init, approval, migration, and gate                | `apps/cli/tests/cli.test.ts` (20 tests)           |
| Brand, design, technology, repositories, readiness | `packages/core/src/stages.test.ts` (12 tests)     |
| Foundation detection                               | `packages/core/src/foundation.test.ts` (3 tests)  |

The interactive flow was also exercised once through a real terminal: every
prompt accepted a value or its default, the preview printed, the file was
created, `vahu validate` reported `IDENTITY_NOT_APPROVED`, and `vahu identity
approve` cleared it. Interactive behaviour is not covered by an automated test.

## Acceptance

| Criterion                                          | State   | Evidence                                                        |
| -------------------------------------------------- | ------- | --------------------------------------------------------------- |
| Identity is captured through a guided flow         | Met     | `vahu init`, interactive and flag-driven                        |
| Identity is a valid `.vahu/project.json`           | Met     | `buildProjectConfig` runs the schema parser                     |
| Nothing is approved on the user's behalf           | Met     | `init` writes `pending`; approval needs `--by`                  |
| No file is overwritten without preview and consent | Met     | `saveProjectConfig` refuses unless `overwrite` is explicit      |
| Onboarding can be resumed                          | Met     | Re-running `init` prefills from the configuration               |
| Every Stage 1 roadmap field is captured            | Met     | Schema 1.1.0 per ADR-0007; `init` flags and prompts             |
| Older configurations stay readable                 | Met     | 1.0.0 migration, validated before transforming                  |
| Brand capture with explicit states and reasons     | Met     | `vahu brand`; not-applicable needs notes, approval needs assets |
| Design-system recording and approval               | Met     | `vahu design`, `vahu design approve`                            |
| Design-system analysis and generation              | Not met | Stage 3 remainder; no token inspection or proposal              |
| Technology selection per area                      | Met     | `vahu technology`                                               |
| Repository strategy, notes, locations, and owners  | Met     | `vahu repositories --location name=path --owner name=team`      |
| Engineering-foundation inspection                  | Met     | `vahu foundation`; detected facts are not stored                |
| Readiness report and opt-in record                 | Met     | `vahu readiness [--record]`                                     |

## Non-goals

Stage 3 still does not generate brand assets, analyse design tokens, propose or
generate a design system. The implemented CLI also does not validate technology
profiles or store detected foundation facts. It never marks a project ready on
its own. Design-system analysis/proposals and stored foundation facts remain
tracked work.
