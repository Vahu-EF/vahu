# P1-08 — API design

- **Standard ID:** P1-08
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.0
- **Applies to:** HTTP APIs, RPC interfaces, library interfaces, events, and CLI contracts.
- **Content type:** standard
- **Lifecycle stages:** design, implementation, review
- **Project types:** all
- **Depends on:** P1-01, P1-14
- **Tags:** api, contracts, compatibility
- **Related:** [P1-01: Architecture principles](architecture-principles.md), [P1-06: Errors and logging](errors-and-logging.md), [P1-09: Data design](data-design.md), [P1-14: Engineering decisions](engineering-decisions.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Treat an interface as a promise to someone who is not in the room. A stable,
predictable contract lets consumers build without reading the implementation and
lets the provider change internals safely.

## Scope

This standard covers interface shape, naming, error contracts, versioning,
validation, and compatibility for any interface another component or person
consumes.

## Non-goals

This standard does not:

- prescribe REST, GraphQL, gRPC, or an event schema format;
- define internal module boundaries. P1-01 owns those;
- define storage schema or migration policy. P1-09 owns data design;
- define authentication and authorization mechanics. P1-13 owns the security
  baseline;
- require a specific documentation generator.

## Rules

### P1-08-R1 — Define the contract before the implementation

- **Level:** MUST
- **Rule:** A new or changed interface has a written contract: operations,
  inputs, outputs, error shapes, and compatibility expectations. The contract has
  an owner and a location a consumer can find without reading the provider's
  source.
- **Rationale:** A contract discovered by trial and error cannot be reviewed or
  versioned, and every consumer encodes a different assumption.
- **Verification:** Review the change for a contract document or schema and
  confirm it matches the implementation.

### P1-08-R2 — Use consistent, resource-oriented naming

- **Level:** SHOULD
- **Rule:** Name operations and fields for the domain concept, in one grammatical
  form across the interface. Use plural collection names, stable identifiers, and
  one term per concept. Do not mix verbs, abbreviations, and synonyms for the
  same idea.
- **Rationale:** Consistency is what makes an interface predictable enough to use
  without consulting the documentation for every call.
- **Verification:** Review the contract as a consumer. Naming follows one pattern
  and one vocabulary.

### P1-08-R3 — Make errors part of the contract

- **Level:** MUST
- **Rule:** Every operation declares its failure modes with stable, documented
  error codes and a consistent payload shape. Distinguish invalid input, missing
  authorization, missing resource, conflict, and internal failure.
- **Rationale:** Consumers must branch on failure programmatically. A prose
  message alone forces fragile string matching.
- **Verification:** Review the contract for declared error codes and verify each
  is produced by a test.

### P1-08-R4 — Validate and reject at the boundary

- **Level:** MUST
- **Rule:** Validate every external input against the contract before using it,
  and reject invalid input with a specific error. Do not pass partially validated
  input into domain logic.
- **Rationale:** Validation at the boundary keeps every downstream assumption
  true and produces one consistent error shape instead of scattered failures.
- **Verification:** Review each entry point for validation and a rejection test.

### P1-08-R5 — Never break a published contract silently

- **Level:** MUST
- **Rule:** Removing a field or operation, changing a type, changing a meaning, or
  making an optional input required is a breaking change. A breaking change needs
  a new version and a migration path, or an approved deprecation window with a
  removal date.
- **Rationale:** Silent breakage is discovered by consumers in production, not by
  the provider in review.
- **Verification:** Compare the contract before and after. A breaking change has
  a version, a migration note, and an owner.

### P1-08-R6 — Make writes idempotent where retries are expected

- **Level:** SHOULD
- **Rule:** An operation that a consumer may retry, such as a payment or a job
  submission, accepts an idempotency key or otherwise guarantees that a repeated
  request does not duplicate its effect.
- **Rationale:** Networks fail after the server commits. Without idempotency,
  retries duplicate records and charges.
- **Verification:** Review the operation and its retry test.

### P1-08-R7 — Bound and document collection responses

- **Level:** MUST
- **Rule:** A collection response has a documented default limit, a maximum
  limit, a deterministic order, and a pagination mechanism. Reject or clamp
  out-of-range values explicitly.
- **Rationale:** An unbounded collection is a denial-of-service vector and a
  source of unstable output for consumers.
- **Verification:** Review the contract for limits, ordering, and pagination, and
  test the boundary values.

### P1-08-R8 — Do not leak internal structure

- **Level:** MUST NOT
- **Rule:** Do not expose database column names, internal identifiers that imply
  storage layout, stack traces, class names, or vendor detail in a public
  contract. Map internals to contract terms at the boundary.
- **Rationale:** Leaked internals become a de facto contract, and they hand an
  attacker a map of the system.
- **Verification:** Review response shapes and error payloads against the
  internal model.

### P1-08-R9 — Version deliberately and document the compatibility policy

- **Level:** MUST
- **Rule:** A versioned interface states what counts as a breaking change, how
  long old versions are supported, and how a consumer migrates. Version the
  contract, not the deployment.
- **Rationale:** Without an explicit policy, every change is argued from
  preference rather than from a promise.
- **Verification:** Review the interface documentation for a stated compatibility
  policy.

## Examples

### Compliant: declared failures

An operation declares `invalid_request`, `not_found`, and `conflict` with one
response shape, and a test produces each one. Consumers branch on `code`, not on
message text.

### Compliant: bounded collection

A list operation defaults to 20 items, caps at 100, supports a cursor, and orders
by creation time with the identifier as a tie-breaker.

### Non-compliant: leaked storage

A response returns database row identifiers and column names directly, so a
schema rename becomes a breaking API change.

### Non-compliant: silent breaking change

A field is renamed without a version bump because "nobody uses it". A consumer
that did use it fails at runtime with no migration path.

## Exceptions

Exceptions follow P1-14-R12. An internal, single-consumer interface may skip a
formal compatibility policy while both sides ship together; the exception names
the rule, the interface, the owner, and the date the policy is required.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- contract presence for changed entry points;
- schema comparison for breaking changes;
- error-code coverage in tests;
- pagination boundary tests.

## Related decisions

- [P1-01: Architecture principles](architecture-principles.md)
- [P1-06: Errors and logging](errors-and-logging.md)
- [P1-09: Data design](data-design.md)
- [P1-14: Engineering decisions](engineering-decisions.md)

## Change history

| Version | Date       | Change                         |
| ------- | ---------- | ------------------------------ |
| 0.1.0   | 2026-11-07 | Initial draft.                 |
| 0.1.0   | 2026-11-07 | Accepted by the project owner. |

## Approval record

| Version | Status   | Approver           | Date       |
| ------- | -------- | ------------------ | ---------- |
| 0.1.0   | Accepted | VAHU project owner | 2026-11-07 |
