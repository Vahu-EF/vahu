# Phase 1 specification — Core Engineering

- **Status:** In Progress — P1-14 first slice; owner acceptance pending
- **Depends on:** accepted Phase 0 foundation
- **Owner approval:** P1-14 implementation authorized 2026-11-06; standard content acceptance pending

## Goal

Create the universal, technology-independent engineering standards that a VAHU
project can adopt. Phase 1 is content and validation work, not a broad CLI
feature release.

## Implementation status

P1-14 is the only authorized Phase 1 work package. It is implemented as a
[draft standard](../../packages/framework/core/engineering-decisions.md) and
becomes binding only after the project owner records acceptance.

| ID                 | Status                          | Canonical page                                                                  |
| ------------------ | ------------------------------- | ------------------------------------------------------------------------------- |
| P1-14              | Draft; owner acceptance pending | [Engineering decisions](../../packages/framework/core/engineering-decisions.md) |
| P1-01–P1-13, P1-15 | Not started                     | None                                                                            |

The first slice adds the P1-14 page, the ADR and standard templates, the
decision index update, and status updates. It adds no runtime code, CLI command,
schema, validator, adapter, or technology profile.

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

## Suggested order

1. P1-14 establishes decision ownership and the standard-page format. P1-01
   starts only after P1-14 is accepted.
2. P1-03, P1-04, P1-05, P1-06, and P1-07 establish day-to-day code rules.
3. P1-08, P1-09, and P1-10 establish interface, data, and evidence rules.
4. P1-11, P1-12, and P1-13 make review and security explicit.
5. P1-15 adds only checks that are stable and testable.
6. P1-02 is finalized after the content shows which repository boundaries are
   actually required.

## Constraints

- Standards must be technology-independent where possible.
- Stack-specific detail belongs in technology profiles, not core standards.
- Do not duplicate a rule across a standard, a template, and a CLI message.
- Every executable rule needs a test.
- Do not add a remote service or a database.
- Do not claim an agent adapter is supported.
- Do not publish npm packages or GitHub Releases.

## Acceptance

- Every Phase 1 work package has a canonical page.
- Rules are checkable and have examples and exceptions where needed.
- Automated checks are covered by tests.
- The CLI remains a presentation layer over reusable core logic.
- Existing Phase 0 checks continue to pass.
- The project owners have approved the standards before release preparation.

## Explicit non-goals

Full technology profiles, agent adapters, the onboarding wizard, documentation
generation, and marketplace features remain outside Phase 1.
