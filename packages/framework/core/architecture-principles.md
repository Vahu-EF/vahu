# P1-01 — Architecture principles

- **Standard ID:** P1-01
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-06.
- **Version:** 0.1.0
- **Applies to:** Architecture decisions and changes in VAHU projects, including modules, packages, services, repositories, APIs, data stores, and shared libraries.
- **Content type:** standard
- **Lifecycle stages:** design, implementation, review
- **Project types:** all
- **Depends on:** P1-14
- **Tags:** architecture, boundaries, ownership
- **Related:** [P1-14: Engineering decisions](engineering-decisions.md), [Phase 1 specification](../../../architecture/specifications/phase-1.md), [ADR-0001](../../../architecture/decisions/ADR-0001-monorepo-boundaries.md), [ADR-0004](../../../architecture/decisions/ADR-0004-agent-adapter-boundary.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Provide technology-independent principles for boundaries, coupling, ownership,
and change. Help reviewers ask the same architecture questions across different
stacks and project sizes.

## Scope

This standard covers the shape of a system: how parts are separated, who owns
them, how they depend on each other, and how change crosses their boundaries.

It applies to new designs and to changes in existing systems. It applies to
modules, packages, services, repositories, APIs, data stores, user interfaces,
and shared libraries.

## Non-goals

This standard does not:

- prescribe a layered, hexagonal, microservice, or monorepo architecture;
- define stack-specific patterns. Those belong in technology profiles;
- replace a decision record. Hard-to-reverse choices still need P1-14;
- define a complete architecture review process;
- add an automated validator. P1-15 owns executable checks.

## Rules

### P1-01-R1 — Name every boundary and its owner

- **Level:** MUST
- **Rule:** Every architecture boundary has a name, an owner, and a stated
  responsibility. Create a boundary only when ownership, change rate, security,
  deployment, or reuse requires one. Do not create a boundary only to mirror a
  folder or a team chart.
- **Rationale:** An unowned boundary becomes a shared dumping ground. A
  boundary without a real reason adds navigation and coordination cost.
- **Verification:** Architecture review or an ADR names the boundary, owner,
  and responsibility. Code ownership and documentation agree with that record.

### P1-01-R2 — Depend on contracts, not internals

- **Level:** MUST
- **Rule:** A consumer depends on a published contract, not another
  component's internal files, private functions, tables, or implementation
  details. Contracts include APIs, schemas, events, and ports. Keep
  implementation details private.
- **Rationale:** Internal coupling turns a local change into a cross-boundary
  change. A contract lets each side change behind a stable promise.
- **Verification:** Review imports, API calls, and data access. A
  cross-boundary dependency must point to a named contract, not a private
  module. The contract has an owner and a compatibility rule.

### P1-01-R3 — Keep the dependency graph acyclic

- **Level:** MUST
- **Rule:** Module, package, and service dependencies form a directed acyclic
  graph. If two areas need each other, extract a contract, invert one
  dependency, or use an event. Do not add a dependency cycle.
- **Rationale:** Cycles prevent independent builds, tests, and ownership. They
  spread change in both directions and make removal difficult.
- **Verification:** Review the dependency graph during architecture review.
  Build and test boundaries must not require a cycle. P1-15 may add an
  automated graph check when the rule is stable.

### P1-01-R4 — Separate concerns that change at different rates

- **Level:** SHOULD
- **Rule:** Keep stable policy and domain logic separate from volatile
  delivery, UI, transport, storage, and vendor SDKs. Put adapters at the edge
  and keep vendor-specific code out of the core.
- **Rationale:** Stable rules should not be rewritten when a vendor, transport,
  or screen changes. Edge adapters make replacement cheaper.
- **Verification:** Review dependency direction and adapter placement. Domain
  tests should run without a network, database, or vendor account.

### P1-01-R5 — Make cross-boundary change explicit and reversible

- **Level:** SHOULD
- **Rule:** Prefer small, reversible changes. When a change alters a public
  contract, ownership, data lifecycle, security boundary, or package boundary,
  record the decision under P1-14 and provide a migration or rollback path.
- **Rationale:** Cross-boundary changes carry coordination and failure costs.
  Explicit decisions and a rollback path reduce the cost of being wrong.
- **Verification:** Confirm that an ADR exists when the P1-14 triggers apply.
  Check that the change has a migration or rollback note and that the affected
  owners reviewed it.

## Examples

### Compliant: a port at the boundary

Checkout code depends on a `PaymentGateway` contract. The provider SDK sits in
an adapter at the edge. The checkout tests use a fake gateway and do not need a
provider account. The adapter can be replaced without changing checkout rules.

### Compliant: one owner for a shared contract

A configuration schema is owned by the schemas package. Consumers import the
published schema and do not read another package's internal files. A breaking
change follows the schema versioning rule.

### Non-compliant: a leaky boundary

The UI imports database models and writes SQL directly. A storage change now
requires a UI change, and the UI cannot be tested without a database. The
boundary exists in the folder tree but not in the dependency graph.

### Non-compliant: a dependency cycle

Two packages import each other's internal helpers to avoid a small amount of
duplication. Neither package can build or test alone, and a change in either
one can break the other. Extract the shared contract or move the helper to an
owned utility with a clear purpose.

## Exceptions

Exceptions follow P1-14-R12. A legacy system may keep a known cycle during a
migration, but the exception must name the rule, scope, owner, expiry, and
migration plan. Do not hide an exception in code or review comments.

## Verification

This standard is verified by architecture review and pull-request review against
the rules above. The repository gate is:

```bash
pnpm check
```

Implemented by `pnpm validate:workspace` and `pnpm validate:standards`:

- workspace dependency-cycle detection (`WORKSPACE_DEPENDENCY_CYCLE`);
- forbidden cross-package dependency edges (`WORKSPACE_FORBIDDEN_DEPENDENCY`);
- content dependency-cycle detection (`CONTENT_DEPENDENCY_CYCLE`);
- owner metadata on standard and content pages (`STANDARD_METADATA`,
  `CONTENT_METADATA`).

Still planned for P1-15:

- private-file import detection across package boundaries;
- contract and migration-link checks.

## Related decisions

- [P1-14: Engineering decisions](engineering-decisions.md)
- [ADR-0001: Monorepo boundaries](../../../architecture/decisions/ADR-0001-monorepo-boundaries.md)
- [ADR-0003: Configuration contract](../../../architecture/decisions/ADR-0003-configuration-contract.md)
- [ADR-0004: Agent adapter boundary](../../../architecture/decisions/ADR-0004-agent-adapter-boundary.md)

## Change history

| Version | Date       | Change                                                                        |
| ------- | ---------- | ----------------------------------------------------------------------------- |
| 0.1.0   | 2026-11-06 | Initial draft; accepted by the project owner.                                 |
| 0.1.0   | 2026-11-07 | Verification list split into implemented and planned checks; no rule changed. |

## Approval record

| Version | Status   | Approver           | Date       |
| ------- | -------- | ------------------ | ---------- |
| 0.1.0   | Accepted | VAHU project owner | 2026-11-06 |
