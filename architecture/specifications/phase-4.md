# Phase 4 specification — Technology Profiles

- **Status:** In Progress — schema, first profiles, evaluator, and preview-first CLI technology selection implemented; content composition remains
- **Depends on:** Phase 1 standards, Phase 2 onboarding, Phase 3 agent contract
- **Owner approval:** Phase 4 approved by the VAHU project owner on 2026-11-07
- **Canonical for:** the profile format and composition rules

## Goal

Apply stack-specific engineering practice only where a project selects that
stack, with version support, prerequisites, and conflicts stated instead of
assumed.

## Status

| Deliverable                                    | State                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| Profile schema and metadata                    | Implemented (`profile.schema.json`)                                         |
| First technology profiles                      | Three: Node.js backend, PostgreSQL, Vitest                                  |
| Profile authoring guide                        | Implemented in the profiles directory                                       |
| Catalog validation gate                        | Implemented (`pnpm validate:profiles`)                                      |
| Selection and compatibility evaluator          | Implemented in `@vahu-ef/core`                                              |
| Frontend, mobile, infrastructure, API families | Not written                                                                 |
| CLI profile technology add/remove              | Implemented with preview and explicit `--write`; profile IDs are not stored |
| Composition into content or agents             | Not started                                                                 |

## Model

A profile is JSON validated by `profile.schema.json`, described in
[ADR-0009](../decisions/ADR-0009-technology-profile-contract.md): identity,
category, technology and supported versions, project types, prerequisites,
related profiles, conflicts, and guidance for architecture, structure,
conventions, testing, security, documentation, tooling, and checks.

## Selection rules

`vahu profile add/remove <profile-id> --area <area>` updates the corresponding
project technology value. It refuses unknown profiles, mismatched areas or
project types, unmet prerequisites, conflicts, unselected removals, and removal
of a prerequisite still in use. Changes are previewed by default and require
`--write` to persist. The current configuration schema stores technology names,
not selected profile IDs; no separate provenance is recorded.

- A profile applies only when its `technology` appears in the project's
  technology selection **and** its `projectTypes` matches the project type.
- Nothing is selected by default; an empty selection selects nothing.
- `evaluateProfileSelection` reports, with the profile that introduced it:
  - a conflict between two selected profiles;
  - a prerequisite that is selected by the project but not co-selected;
  - a technology with no covering profile.
- The evaluator never chooses between conflicting profiles and never upgrades a
  recommendation to a blocking error.

## Validation

```bash
pnpm validate:profiles
```

It checks schema validity, duplicate identifiers, unknown references,
self-reference, and prerequisite cycles, and runs in `pnpm check` and CI. The
logic lives in `packages/core/src/profiles.ts` and is covered by
`packages/core/src/profiles.test.ts`; the schema is covered by
`packages/schemas/src/profile.test.ts`.

## Acceptance

| Criterion                                    | State   | Evidence                                                     |
| -------------------------------------------- | ------- | ------------------------------------------------------------ |
| Profiles are independently reusable          | Met     | JSON files with no shared state                              |
| Profiles declare supported versions          | Met     | `supportedVersions` is required and non-empty                |
| A project can select multiple profiles       | Partial | CLI selects technology values; schema has no profile ID list |
| Conflicts are surfaced with explanations     | Met     | `PROFILE_CONFLICT` names both profiles                       |
| No profile is assumed                        | Met     | Empty selection applies nothing                              |
| Concrete profiles cover the roadmap families | Partial | Backend, database, and testing only                          |

## Out of scope

Executing a profile's checks for a project, generating project structure,
installing dependencies, and claiming a profile is verified against a real
project without a maintainer check.
