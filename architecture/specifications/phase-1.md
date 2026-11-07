# Phase 1 specification — Core Engineering

- **Status:** Complete
- **Depends on:** accepted Phase 0 foundation
- **Owner approval:** P1-14 and P1-01 accepted 2026-11-06; P1-02–P1-13 and P1-15 accepted 2026-11-07

## Goal

Create the universal, technology-independent engineering standards that a VAHU
project can adopt. Phase 1 is content and validation work, not a broad CLI
feature release.

## Implementation status

All 15 work packages are accepted and binding. P1-14 and P1-01 were accepted on
2026-11-06; the other 13 were accepted by the project owner on 2026-11-07 at
version 0.1.0 (0.1.1 for P1-15), each with an approval record on its page.

| ID    | Status   | Canonical page                                                                      |
| ----- | -------- | ----------------------------------------------------------------------------------- |
| P1-14 | Accepted | [Engineering decisions](../../packages/framework/core/engineering-decisions.md)     |
| P1-01 | Accepted | [Architecture principles](../../packages/framework/core/architecture-principles.md) |
| P1-02 | Accepted | [Repository organization](../../packages/framework/core/repository-organization.md) |
| P1-03 | Accepted | [Code quality](../../packages/framework/core/code-quality.md)                       |
| P1-04 | Accepted | [Naming](../../packages/framework/core/naming.md)                                   |
| P1-05 | Accepted | [Dependencies](../../packages/framework/core/dependencies.md)                       |
| P1-06 | Accepted | [Errors and logging](../../packages/framework/core/errors-and-logging.md)           |
| P1-07 | Accepted | [Configuration](../../packages/framework/core/configuration.md)                     |
| P1-08 | Accepted | [API design](../../packages/framework/core/api-design.md)                           |
| P1-09 | Accepted | [Data design](../../packages/framework/core/data-design.md)                         |
| P1-10 | Accepted | [Testing](../../packages/framework/core/testing.md)                                 |
| P1-11 | Accepted | [Code review](../../packages/framework/core/code-review.md)                         |
| P1-12 | Accepted | [Documentation](../../packages/framework/core/documentation.md)                     |
| P1-13 | Accepted | [Security baseline](../../packages/framework/core/security-baseline.md)             |
| P1-15 | Accepted | [Validation contracts](../../packages/framework/core/validation-contracts.md)       |

The standards add no CLI command, adapter, or technology profile. P1-15 adds the
framework validator, and the Phase 1 content model adds the metadata schema and
composition rules described below.

## Work packages

| ID    | Package                 | Output                                                          |
| ----- | ----------------------- | --------------------------------------------------------------- |
| P1-01 | Architecture principles | Decision guidance for boundaries, coupling, and ownership       |
| P1-02 | Repository organization | Folder and ownership conventions per project type               |
| P1-03 | Code quality            | Review, complexity, and maintainability rules                   |
| P1-04 | Naming                  | Language-neutral naming guidance with stack examples            |
| P1-05 | Dependencies            | Selection, review, update, and removal rules                    |
| P1-06 | Errors and logging      | Failure, observability, and user-message conventions            |
| P1-07 | Configuration           | Environment, secret, and versioned-config rules                 |
| P1-08 | API design              | Contract, versioning, and error-shape guidance                  |
| P1-09 | Data design             | Schema, migration, and data-lifecycle principles                |
| P1-10 | Testing                 | Unit, integration, end-to-end, and evidence rules               |
| P1-11 | Code review             | Review checklist and approval expectations                      |
| P1-12 | Documentation           | README, ADR, API, data, and operations documentation rules      |
| P1-13 | Security baseline       | Trust boundaries, secrets, dependencies, and review             |
| P1-14 | Engineering decisions   | ADR lifecycle and decision ownership                            |
| P1-15 | Validation contracts    | Machine-readable checks for the standards that can be automated |

## Validation

P1-15 adds one executable contract:

```bash
pnpm validate:standards
```

It checks standard-page metadata, required sections and their order, rule IDs and
rule fields, relative links, and decision-index completeness. The logic lives in
`packages/core/src/standards.ts` and is covered by
`packages/core/src/standards.test.ts`. `pnpm check` and the CI `verify` job run it
after the workspace-boundary check.

The same command runs the content-model validator: content metadata, identifiers,
applicability, dependency graph and cycles, deprecation notes, and composition
precedence. The contract is documented in
[the content model](../../packages/framework/CONTENT_MODEL.md), the schema is
`@vahu-ef/schemas/content.schema.json`, and the logic in `packages/core/src/content.ts`
is covered by `packages/core/src/content.test.ts`.

## Suggested order

1. P1-14 and P1-01 establish decision ownership, the standard-page format, and
   core architecture principles.
2. P1-03, P1-04, P1-05, P1-06, and P1-07 establish day-to-day code rules.
3. P1-08, P1-09, and P1-10 establish interface, data, and evidence rules.
4. P1-11, P1-12, and P1-13 make review and security explicit.
5. P1-15 adds only checks that are stable and testable.
6. P1-02 is finalized after the content shows which repository boundaries are
   actually required.

Steps 2–5 are accepted. P1-02 continues to be reviewed as the repository
boundaries evolve, per rule P1-02-R7.

## Constraints

- Standards must be technology-independent where possible.
- Stack-specific detail belongs in technology profiles, not core standards.
- Do not duplicate a rule across a standard, a template, and a CLI message.
- Every executable rule needs a test.
- Do not add a remote service or a database.
- Do not claim an agent adapter is supported.
- Do not publish npm packages or GitHub Releases.

## Acceptance

| Criterion                                               | State | Evidence                                                                                 |
| ------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------- |
| Every work package has a canonical page                 | Met   | The status table above links all 15                                                      |
| Rules are checkable, with examples and exceptions       | Met   | Each page has rule IDs, levels, examples, and exceptions                                 |
| Automated checks are covered by tests                   | Met   | `standards.test.ts`, `content.test.ts`, `workspace.test.ts`                              |
| The CLI remains a presentation layer over core logic    | Met   | `apps/cli` imports `@vahu-ef/core`; both validators are scripts over tested package code |
| Existing Phase 0 checks continue to pass                | Met   | `pnpm check` passes (67 tests when this report was written)                              |
| Owners approve the standards before release preparation | Met   | Accepted by the project owner on 2026-11-07; see each page's approval record             |

## Completion report

Phase 1 is complete and accepted. What exists:

- 15 accepted standard pages under `packages/framework/core/`.
- A content model contract (`CONTENT_MODEL.md`) with a schema
  (`content.schema.json`) and `discoverContent`/`composeContent` in
  `@vahu-ef/core`.
- Two repository gates — `validate:workspace` and `validate:standards` — both
  thin scripts over `@vahu-ef/core`, both covered by tests.

Remaining work is tracked, not hidden:

1. Per-standard checks still listed as planned in each page's `Verification`
   section, and the composition engine is not yet applied to a project
   configuration by any command.
2. Phase 2 (Project Identity & Onboarding) requires its own approval before it
   starts; see [the roadmap](roadmap.md).

## Explicit non-goals

Full technology profiles, agent adapters, the onboarding wizard, documentation
generation, and marketplace features remain outside Phase 1.
