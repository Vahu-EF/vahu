# P1-10 — Testing

- **Standard ID:** P1-10
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.0
- **Applies to:** All executable code: applications, services, libraries, CLIs, and build tooling.
- **Content type:** standard
- **Lifecycle stages:** implementation, review, release
- **Project types:** all
- **Depends on:** P1-03, P1-14
- **Tags:** testing, evidence, verification
- **Related:** [P1-03: Code quality](code-quality.md), [P1-11: Code review](code-review.md), [P1-15: Validation contracts](validation-contracts.md), [P1-14: Engineering decisions](engineering-decisions.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Turn "it works on my machine" into evidence a reviewer can inspect and a future
change can rely on. Tests are the record of intended behavior, not a score to
maximize.

## Scope

This standard covers what evidence accompanies a change, how tests are written
and named, how they are isolated, and how failures are handled.

## Non-goals

This standard does not:

- mandate a test framework, runner, or coverage threshold;
- define review or approval mechanics. P1-11 owns review;
- define automated repository checks. P1-15 owns validation contracts;
- require every line to be covered;
- define performance or load-test targets for a specific product.

## Rules

### P1-10-R1 — Every behavior change carries evidence

- **Level:** MUST
- **Rule:** A change that alters behavior includes a test that fails without the
  change and passes with it, or a stated, reproducible manual verification when
  automation is not practical. Defect fixes include a test that reproduces the
  defect.
- **Rationale:** A test written after the implementation only proves what the
  implementation happens to do; a test that never failed proves nothing.
- **Verification:** Review the change for the test and, for a fix, the
  reproduction. Confirm the test fails without the change.

### P1-10-R2 — Test behavior through a public interface

- **Level:** MUST
- **Rule:** Assert on observable behavior at a boundary the consumers use. Do not
  assert on private helpers, internal call order, or implementation detail unless
  that detail is the contract.
- **Rationale:** Implementation-coupled tests break on every refactor and give
  false confidence while the behavior is wrong.
- **Verification:** Review the test's imports and assertions. They use the public
  surface and survive a local refactor.

### P1-10-R3 — Match test scope to the risk

- **Level:** SHOULD
- **Rule:** Prefer many fast, focused tests; add integration tests where units
  meet a real dependency; add end-to-end tests for critical user journeys. Do not
  cover every case at the slowest level, and do not claim end-to-end coverage from
  unit tests.
- **Rationale:** A slow suite is skipped, and a fast suite cannot prove wiring.
  The right mix gives coverage where failures are most likely and most costly.
- **Verification:** Review the level of new tests against the risk of the change.

### P1-10-R4 — Name the behavior and assert one intent

- **Level:** MUST
- **Rule:** A test name states the condition and the expected outcome. Each test
  verifies one intent; split a test whose name needs "and" to describe two
  behaviors.
- **Rationale:** A failing test name should be enough to start a diagnosis.
  Multi-intent tests report one failure and hide the rest.
- **Verification:** Read the test names in the change without the bodies. The
  intended behavior is clear.

### P1-10-R5 — Keep tests deterministic and independent

- **Level:** MUST
- **Rule:** A test does not depend on execution order, on state left by another
  test, or on ambient conditions such as the local clock, locale, network, or
  filesystem outside its workspace. Give each test its own setup and cleanup.
- **Rationale:** Order-dependent and environment-dependent tests fail
  intermittently, which trains the team to ignore failures.
- **Verification:** Run the suite in isolation, in a different order, and from a
  clean environment.

### P1-10-R6 — Control time, randomness, and external systems

- **Level:** MUST
- **Rule:** Inject or freeze the clock and random source in code under test, and
  replace external systems with a fake or a recorded fixture at the boundary.
  Never call a real third-party service from a unit test.
- **Rationale:** Uncontrolled inputs make failures unreproducible and tests slow,
  costly, and flaky.
- **Verification:** Review the test for injected time, seeded randomness, and a
  boundary fake.

### P1-10-R7 — Keep fixtures minimal and owned

- **Level:** SHOULD
- **Rule:** A fixture contains only the data the test needs and is maintained with
  the test that uses it. Shared fixtures are named, versioned, and owned; they are
  not a copy of production data.
- **Rationale:** Large shared fixtures hide what a test depends on, and a change
  to them can silently alter many tests.
- **Verification:** Review fixture sources and their consumers. No production data
  is present, per P1-09.

### P1-10-R8 — Cover failure paths and boundaries

- **Level:** MUST
- **Rule:** Test invalid input, missing data, permission denial, empty collections,
  duplicate operations, and the documented limit values, not only the successful
  path.
- **Rationale:** Most production defects occur on the paths nobody exercised:
  empty, absent, repeated, and unauthorized.
- **Verification:** Review the change for at least one failure and one boundary
  case per new behavior.

### P1-10-R9 — Never silence a failing test

- **Level:** MUST NOT
- **Rule:** Do not skip, disable, or delete a test to make a suite pass. Fix the
  cause, or remove the test with a recorded reason and the replacement coverage.
  A quarantined flaky test names an owner and a fix date.
- **Rationale:** A skipped test is a promise nobody keeps; it hides a real failure
  behind a green summary.
- **Verification:** Review the diff for skip markers and compare the suite summary
  before and after the change.

## Examples

### Compliant: a test that failed first

A defect fix adds a test that returns the wrong total, observes it fail, then
changes the calculation. The test reproduces the reported input exactly.

### Compliant: a boundary fake

A payment test supplies a fake gateway through the port defined for it. No
network call occurs, and the failure path is exercised by returning a declined
result.

### Non-compliant: mocking the unit under test

A test replaces the function it is meant to verify with a stub, then asserts the
stub was called. It passes whether or not the real behavior works.

### Non-compliant: skipped failure

A flaky integration test is marked skipped to unblock a release. It stays skipped
for a year, and the integration it guarded is broken.

## Exceptions

Exceptions follow P1-14-R12. A generated file or a thin binding may rely on a
contract test elsewhere instead of its own test. The exception names the rule,
the file, the owner, and the covering test.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- changed behavior paired with changed tests;
- skip markers reported for review;
- test names checked for the condition and outcome form;
- order-independent and isolated test runs in CI.

## Related decisions

- [P1-03: Code quality](code-quality.md)
- [P1-11: Code review](code-review.md)
- [P1-15: Validation contracts](validation-contracts.md)
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
