# P1-15 — Validation contracts

- **Standard ID:** P1-15
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.1
- **Applies to:** Every standard whose rules can be checked by a machine, and the repository gate that runs those checks.
- **Content type:** standard
- **Lifecycle stages:** implementation, review, release
- **Project types:** all
- **Depends on:** P1-10, P1-14
- **Tags:** validation, automation, contracts
- **Related:** [P1-14: Engineering decisions](engineering-decisions.md), [P1-10: Testing](testing.md), [P1-12: Documentation](documentation.md), [Phase 1 specification](../../../architecture/specifications/phase-1.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Make the automatable part of a standard executable. A rule that a reviewer must
remember is a suggestion; a rule with a tested check is a contract. This standard
also keeps automated checks honest by requiring them to be small, deterministic,
and covered by tests.

## Scope

This standard covers when a rule becomes an automated check, how the check is
written and tested, what it reports, where it runs, and how it is retired. The
implemented checks for this repository are `pnpm validate:workspace` and
`pnpm validate:standards`.

## Non-goals

This standard does not:

- automate judgment calls such as readability, naming quality, or whether a design
  is appropriate;
- replace review. Most rules in Phase 1 remain review-verified;
- define a specific linter or CI vendor;
- require every rule to have an automated check;
- introduce a remote service or a hosted validation API.

## Rules

### P1-15-R1 — Automate only stable, testable rules

- **Level:** MUST
- **Rule:** Add an automated check only when the rule is stable and its result is
  a yes-or-no fact. Leave judgment, trade-off, and context-dependent rules to
  review.
- **Rationale:** An unstable or opinionated check produces false positives, gets
  disabled, and takes the credible checks with it.
- **Verification:** Review the check against the rule text. The check tests one
  stated condition with no heuristic scoring.

### P1-15-R2 — Every executable check has a test

- **Level:** MUST
- **Rule:** An automated check ships with tests that prove it accepts valid input
  and rejects each failure mode it claims to detect. A check without a failing
  fixture is not evidence.
- **Rationale:** An untested check may silently pass everything, which is worse
  than no check because the summary claims protection that does not exist.
- **Verification:** Review the test file for a passing fixture and one failing
  fixture per reported code.

### P1-15-R3 — Report the rule, the location, and the fix

- **Level:** MUST
- **Rule:** A failing check names the violated standard or rule, the file or field
  that failed, and what to change. Do not emit a bare "validation failed".
- **Rationale:** A failure message is read by someone who did not write the check;
  without the rule and the location they must read the validator source.
- **Verification:** Trigger each failure code in the tests and read the messages.

### P1-15-R4 — Fail the gate with a non-zero exit

- **Level:** MUST
- **Rule:** A validation failure exits non-zero and is wired into the repository
  gate, so a failing check blocks the change rather than printing a warning that
  nobody reads.
- **Rationale:** An advisory check is skipped under deadline pressure, which is
  exactly when it matters.
- **Verification:** Run the gate with a deliberately invalid file and confirm a
  non-zero exit and a failing CI step.

### P1-15-R5 — Run deterministically and offline

- **Level:** MUST
- **Rule:** A check reads repository content and produces the same result on every
  run and machine. It must not depend on network access, wall-clock time, random
  values, or ambient environment state.
- **Rationale:** A non-deterministic check fails intermittently and trains the team
  to rerun it instead of reading it.
- **Verification:** Run the check twice on unchanged input and compare output.

### P1-15-R6 — Keep the check and the rule in their own homes

- **Level:** MUST
- **Rule:** Keep executable logic in `packages/core/` with its tests, keep the
  normative text in the standard page, and keep the repository script a thin
  entry point. Do not restate a rule inside the validator.
- **Rationale:** Duplicated rule text drifts, and logic buried in a script cannot
  be reused by the CLI.
- **Verification:** Review the change. The script parses arguments and reports
  results; the reusable logic and rules live in their packages.

### P1-15-R7 — Report planned checks honestly

- **Level:** MUST NOT
- **Rule:** A standard page may list a check as planned for P1-15, but it must not
  claim a rule is automated, enforced, or covered when no check exists. When a
  check ships, move it out of the planned list.
- **Rationale:** A false enforcement claim is worse than an acknowledged gap,
  because it stops anyone from verifying the rule.
- **Verification:** Compare each standard's `Verification` section with the
  repository gate's actual steps.

### P1-15-R8 — Version a check before it becomes breaking

- **Level:** SHOULD
- **Rule:** When a new check would fail existing content that already complies
  with the rule, fix the content first or introduce the check as a warning with a
  stated enabling date. Do not land a check that fails the default branch.
- **Rationale:** A gate that is red on arrival is disabled by the next contributor,
  taking every other check with it.
- **Verification:** Run the full gate on the default branch before merge.

### P1-15-R9 — Retire a check with its rule

- **Level:** MUST
- **Rule:** When a rule is superseded or retired, update or remove its check in the
  same change, and keep the history in the standard and the decision record. Do
  not leave a check enforcing a retired rule.
- **Rationale:** A check for a retired rule blocks valid work and contradicts the
  current standard.
- **Verification:** Compare the gate's steps with the accepted standards.

## Implemented checks

| Command                   | Contract                                                                                    | Test                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `pnpm validate:workspace` | Required repository structure, one profile location, package boundaries, dependency cycles  | [`workspace.test.ts`](../../core/src/workspace.test.ts) |
| `pnpm validate:standards` | Standard metadata, required sections, rule IDs, rule fields, relative links, decision index | [`standards.test.ts`](../../core/src/standards.test.ts) |
| `pnpm validate:standards` | Content metadata, identifiers, applicability, dependency graph, deprecation, composition    | [`content.test.ts`](../../core/src/content.test.ts)     |

`pnpm validate:standards` runs `validateFramework`, which combines the page
validator with the content-model validator. Page codes: `STANDARD_METADATA`,
`STANDARD_STATUS`, `STANDARD_ID`, `STANDARD_SECTION`, `STANDARD_SECTION_ORDER`,
`RULE_MISSING`, `RULE_ID`, `RULE_DUPLICATE`, `RULE_FIELD`, `RULE_LEVEL`,
`LINK_UNRESOLVED`, and `ADR_INDEX_MISSING`. Content codes: `CONTENT_METADATA`,
`CONTENT_ID`, `CONTENT_ID_DUPLICATE`, `CONTENT_TITLE`, `CONTENT_DESCRIPTION`,
`CONTENT_TYPE`, `CONTENT_STATUS`, `CONTENT_VERSION`, `CONTENT_PROJECT_TYPE`,
`CONTENT_STAGE`, `CONTENT_DEPENDENCY`, `CONTENT_DEPENDENCY_UNKNOWN`,
`CONTENT_DEPENDENCY_CYCLE`, and `CONTENT_DEPRECATION`. Composition reports
`COMPOSITION_MANDATORY_OVERRIDE` and `COMPOSITION_UNKNOWN_ID`.

The metadata contract itself is documented in
[the content model](../CONTENT_MODEL.md).

Both scripts are thin entry points over `@vahu-ef/core`; the checks and their
tests live in the package, per P1-15-R6.

## Examples

### Compliant: a stable check

The standards validator rejects a standard page with a duplicate rule ID. The
rule is unambiguous, the failure is a fact, and a test fails without the check.

### Compliant: a reported gap

A standard lists a complexity report as planned because no complexity tool is
configured. Nobody claims the rule is enforced.

### Non-compliant: undocumented judgment

A validator fails a change because a function name "looks unclear". The rule is
not stated, the result is opinion, and contributors cannot satisfy it reliably.

### Non-compliant: silent pass

A validator catches read errors and returns an empty report, so a missing
directory passes the gate. The summary is green and nothing was checked.

## Exceptions

Exceptions follow P1-14-R12. A check may be temporarily advisory during a
migration. The exception names the rule, the check, the owner, the reason, and the
date it becomes blocking.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
```

`pnpm check` runs formatting, lint, type-check, tests, build, workspace
validation, and standards validation. The checks are covered by
`packages/core/src/standards.test.ts`, `packages/core/src/content.test.ts`, and
`packages/core/src/workspace.test.ts`.

Planned and not implemented:

- a check that planned checks are removed from a standard page after they ship;
- ownership metadata validation for new top-level folders;
- supersession link consistency between retired and replacement pages.

## Related decisions

- [P1-14: Engineering decisions](engineering-decisions.md)
- [P1-10: Testing](testing.md)
- [P1-12: Documentation](documentation.md)
- [Phase 1 specification](../../../architecture/specifications/phase-1.md)

## Change history

| Version | Date       | Change                                                                                                                         |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 0.1.0   | 2026-11-07 | Initial draft; adds the standards validator and its test suite.                                                                |
| 0.1.1   | 2026-11-07 | Adds content-model validation and composition checks; both repository scripts become thin entry points over tested core logic. |
| 0.1.1   | 2026-11-07 | Accepted by the project owner.                                                                                                 |

## Approval record

| Version | Status   | Approver           | Date       |
| ------- | -------- | ------------------ | ---------- |
| 0.1.1   | Accepted | VAHU project owner | 2026-11-07 |
