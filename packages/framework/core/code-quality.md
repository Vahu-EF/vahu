# P1-03 — Code quality

- **Standard ID:** P1-03
- **Status:** Draft
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Pending. This page becomes `Accepted` only after the approver records acceptance.
- **Version:** 0.1.0
- **Applies to:** Code changes in VAHU projects, across languages and paradigms.
- **Related:** [P1-14: Engineering decisions](engineering-decisions.md), [P1-01: Architecture principles](architecture-principles.md), [Phase 1 specification](../../../architecture/specifications/phase-1.md), [ADR-0002](../../../architecture/decisions/ADR-0002-typescript-toolchain.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Define technology-independent expectations for code that is easy to read,
change, and verify. Raise the quality of everyday code without turning this
standard into a style guide or a review process.

## Scope

This standard covers the code a maintainer reads and changes: naming, unit
size, cohesion, control flow, duplication, dead code, and refactoring.

It applies to application code, libraries, scripts, tests, and build tooling.
It applies to new code and to code that is already being changed.

## Non-goals

This standard does not:

- define formatting, indentation, or line length. Formatters own that;
- define a test strategy. P1-10 owns testing requirements;
- define the review process or approval rules. P1-11 owns review;
- define architecture boundaries. P1-01 owns those principles;
- require a specific complexity score or metric;
- replace language-specific lint rules or technology profiles;
- add an automated validator. P1-15 owns executable checks.

## Rules

### P1-03-R1 — Optimize for the next reader

- **Level:** MUST
- **Rule:** Names, types, and structure must reveal intent without requiring
  the reader to reconstruct it from the implementation. Prefer a clear direct
  solution over a clever or compressed one. Comments explain why, not what.
- **Rationale:** Code is read more often than it is written. A clear change is
  cheaper to review, test, and repair.
- **Verification:** Review the change as a reader who did not write it. The
  reviewer should be able to explain the purpose of each unit without guessing.

### P1-03-R2 — Keep units small and cohesive

- **Level:** SHOULD
- **Rule:** A function, method, module, or class should have one coherent
  purpose. Split a unit when it mixes separate concerns, such as policy,
  input/output, formatting, persistence, and coordination.
- **Rationale:** Small cohesive units are easier to name, test, reuse, and
  replace. Mixed units hide coupling and make change risky.
- **Verification:** Try to describe the unit in one sentence without using
  "and" to join unrelated jobs. If the sentence needs several jobs, consider a
  split.

### P1-03-R3 — Prefer simple control flow and explicit data flow

- **Level:** SHOULD
- **Rule:** Prefer guard clauses, early returns, and direct parameter passing
  over deep nesting and hidden mutable state. Make the inputs, outputs, and
  failure paths visible at the call site.
- **Rationale:** Deep nesting and hidden state increase the number of cases a
  reader must hold at once. Explicit flow makes defects and missing cases easier
  to spot.
- **Verification:** Review for deep nesting, broad mutable scope, and implicit
  dependencies. Use language or lint complexity reports when available, but do
  not treat a single score as proof of quality.

### P1-03-R4 — Treat duplication as a signal, not a rule

- **Level:** SHOULD
- **Rule:** Remove duplication when the repeated code represents one concept
  with one reason to change. Do not create a shared abstraction for code that
  only looks similar today. A useful abstraction has a clear name and a clear
  owner.
- **Rationale:** Copy-paste spreads fixes, while premature abstraction couples
  unrelated changes. Both costs are real; the reason for change decides.
- **Verification:** Name the shared concept and its owner. If you cannot name
  it without "common", "util", or "helper", keep the code local until the
  concept is clear.

### P1-03-R5 — Remove code that is no longer true

- **Level:** MUST
- **Rule:** Delete dead code, unused flags, abandoned branches, stale comments,
  and commented-out blocks. Use version control for history instead of keeping
  old code in the working tree.
- **Rationale:** Dead code misleads readers, hides the real surface area, and
  makes future changes look safer than they are.
- **Verification:** Search for references before deleting. Use compiler, lint,
  and type checks to confirm the removal. Review the diff for leftover flags or
  comments.

### P1-03-R6 — Refactor in small, behavior-preserving steps

- **Level:** SHOULD
- **Rule:** Keep a refactor separate from a behavior change when practical. Make
  each step small enough to review and verify, and run the relevant checks after
  each step. Do not mix a broad cleanup with an unreviewed feature change.
- **Rationale:** Small steps make regressions easier to locate and roll back.
  Mixing refactor and behavior hides which change caused a failure.
- **Verification:** Review the diff for mixed intent. The existing tests and
  checks should pass after each step. If behavior changes, the change needs its
  own explanation and verification.

## Examples

### Compliant: a readable unit

A function named `calculateInvoiceTotal` takes explicit line items and a tax
rate, uses guard clauses for invalid input, and returns a total. It does not
read global state, write to the database, or format a receipt.

### Compliant: removal instead of preservation

A feature flag has been enabled in every environment for six months. The change
removes the flag, the disabled branch, and the stale comment that describes the
old path. Version control still contains the old implementation.

### Non-compliant: a unit with too many jobs

One function parses a request, validates the payload, writes to the database,
formats an email, and logs the result. A change to email formatting requires
reading and testing the whole function. The unit has several reasons to change.

### Non-compliant: abstraction for accidental similarity

Two unrelated features happen to share a short loop. A contributor extracts a
generic `processItems` helper used by both. The helper has no clear owner, and a
change for one feature now risks the other. The duplication was cheaper than
the false shared concept.

## Exceptions

Exceptions follow P1-14-R12. Legacy code may keep a known quality problem while
a migration is in progress. The exception must name the rule, scope, owner,
expiry, and cleanup plan. Do not hide an exception in a review comment or a
`TODO` without an owner.

## Verification

This draft is verified by code review against the rules above and by the
repository checks that apply to the project. The VAHU repository gate is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- complexity reports for changed units;
- dead-code and unused-export checks;
- duplication review for changed files;
- mixed refactor and behavior-change detection where practical.

## Related decisions

- [P1-14: Engineering decisions](engineering-decisions.md)
- [P1-01: Architecture principles](architecture-principles.md)
- [ADR-0002: TypeScript toolchain](../../../architecture/decisions/ADR-0002-typescript-toolchain.md)

## Change history

| Version | Date       | Change                                      |
| ------- | ---------- | ------------------------------------------- |
| 0.1.0   | 2026-11-06 | Initial draft for the P1-03 implementation. |
