# P1-11 — Code review

- **Standard ID:** P1-11
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.0
- **Applies to:** Every change that reaches a shared or releasable branch.
- **Content type:** standard
- **Lifecycle stages:** review, release
- **Project types:** all
- **Depends on:** P1-03, P1-10, P1-14
- **Tags:** review, approval, quality
- **Related:** [P1-03: Code quality](code-quality.md), [P1-10: Testing](testing.md), [P1-13: Security baseline](security-baseline.md), [P1-14: Engineering decisions](engineering-decisions.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Make review a consistent engineering check rather than a matter of reviewer
taste. A good review catches defects early, spreads context, and leaves a record
of why the change is acceptable.

## Scope

This standard covers when a review is required, what the author supplies, what
the reviewer checks, how findings are classified, and what must be true before
merge.

## Non-goals

This standard does not:

- define branch protection settings or approval counts for a platform;
- define the testing strategy. P1-10 owns testing;
- define quality rules. P1-03 owns code quality;
- replace a security review for changes that alter a trust boundary;
- require a specific review tool.

## Rules

### P1-11-R1 — Review every change before merge

- **Level:** MUST
- **Rule:** No change reaches a shared or releasable branch without review by
  someone other than its author, except an explicitly permitted emergency path
  that is reviewed afterward and recorded.
- **Rationale:** An unreviewed change has no independent check on intent, safety,
  or completeness, and no second person knows it exists.
- **Verification:** Review the change history for approvals. An emergency merge
  has a follow-up review record.

### P1-11-R2 — Keep changes reviewable in size and scope

- **Level:** SHOULD
- **Rule:** A review request covers one coherent change. Split unrelated
  refactors, formatting, dependency updates, and features into separate changes.
- **Rationale:** Review quality drops sharply as a diff grows; mixed intent hides
  the actual behavior change.
- **Verification:** Review the diff for a single stated purpose. A large change
  states why it cannot be split.

### P1-11-R3 — The author states intent, evidence, and risk

- **Level:** MUST
- **Rule:** A review request states the problem, the chosen change, the checks
  that were run, the risks and limitations, and any decision that still needs an
  owner. Do not leave the reviewer to infer intent from the diff.
- **Rationale:** A reviewer who must reconstruct intent reviews the code, not the
  decision, and approves changes they do not understand.
- **Verification:** Read the request description before the diff. It answers what,
  why, and what was verified.

### P1-11-R4 — Review against the standards, not personal preference

- **Level:** MUST
- **Rule:** A finding cites a rule, a defect, a risk, or a documented convention.
  State style preferences without a rule as suggestions, and do not block a change
  on them.
- **Rationale:** Preference-based blocking makes review unpredictable and turns
  contributors away.
- **Verification:** Review the comments. Blocking findings name the rule or the
  concrete risk.

### P1-11-R5 — Distinguish blocking from non-blocking findings

- **Level:** MUST
- **Rule:** Mark each finding as blocking or non-blocking, and state what would
  resolve it. Do not leave an ambiguous comment that the author must interpret.
- **Rationale:** Ambiguity causes either ignored defects or unnecessary rewrites,
  and both erode trust in review.
- **Verification:** Read the findings. Each has a classification and a requested
  action.

### P1-11-R6 — Verify the evidence, not only the code

- **Level:** MUST
- **Rule:** The reviewer confirms that the change includes the evidence its risk
  requires: tests for behavior, migration notes for schema changes, contract
  updates for interfaces, and documentation for user-visible behavior.
- **Rationale:** A correct-looking implementation without evidence shifts the
  cost of verification onto whoever deploys it.
- **Verification:** Review the change against the related standards and confirm
  the evidence exists.

### P1-11-R7 — Do not merge with failing or bypassed checks

- **Level:** MUST NOT
- **Rule:** A change merges only when the required checks pass. Do not disable,
  skip, or override a required check to merge; fix the cause or record an approved
  exception.
- **Rationale:** A bypassed gate teaches the team that the gate is optional and
  makes the failure invisible to the next reader.
- **Verification:** Review the check results on the merged commit.

### P1-11-R8 — Require a domain reviewer for sensitive changes

- **Level:** MUST
- **Rule:** A change that alters a trust boundary, authentication or
  authorization, payment handling, personal data, or a public contract includes a
  reviewer who owns that area.
- **Rationale:** General reviewers cannot reliably judge specialized risk, and
  those changes have the highest cost of being wrong.
- **Verification:** Review the approval list against the change's affected areas.

### P1-11-R9 — Name follow-up work instead of expanding the change

- **Level:** SHOULD
- **Rule:** When review reveals related work outside the change's purpose, record
  it as a follow-up with an owner instead of adding it to the current change.
- **Rationale:** Scope growth during review delays the fix and makes the diff
  harder to verify.
- **Verification:** Review the findings and the recorded follow-ups.

### P1-11-R10 — Resolve or explicitly defer every blocking finding

- **Level:** MUST
- **Rule:** Before merge, each blocking finding is resolved, or deferred with a
  named owner, a reason, and a date. Do not resolve a finding by ignoring it.
- **Rationale:** Unresolved findings are lost after merge, and the reviewer's
  concern is rediscovered as a defect later.
- **Verification:** Compare the findings with the resolution or deferral record.

## Examples

### Compliant: a reviewable change

A request renames one module, updates its callers, and adds tests for the
affected behavior. The description states the reason, the checks run, and one
remaining risk. Findings are marked blocking or non-blocking.

### Compliant: a domain reviewer

A change to session validation requests review from the owner of the
authentication area, who confirms the trust boundary is unchanged.

### Non-compliant: preference blocking

A reviewer blocks a change because they would have named a variable differently,
citing no rule. The author complies, and the next contributor receives the
opposite preference.

### Non-compliant: overridden check

A failing test is marked skipped in the same change that modifies the tested
behavior so the pull request turns green.

## Exceptions

Exceptions follow P1-14-R12. A production incident may require an emergency merge
without prior review. The exception names the rule, the change, the approver, and
the follow-up review that must occur.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- required checks recorded on the merged commit;
- review presence for non-author changes;
- blocking-finding resolution recorded in the change;
- sensitive-area changes mapped to a domain reviewer.

## Related decisions

- [P1-03: Code quality](code-quality.md)
- [P1-10: Testing](testing.md)
- [P1-13: Security baseline](security-baseline.md)
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
