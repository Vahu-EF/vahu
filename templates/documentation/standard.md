# P1-XX — Standard title

- **Standard ID:** P1-XX
- **Status:** Draft | Accepted | Superseded | Retired
- **Owner:** [person or team responsible for the content]
- **Approver:** [person or role that accepts the standard]
- **Approval:** Pending | Approved by [name or role] on YYYY-MM-DD
- **Version:** 0.1.0
- **Applies to:** [projects, packages, or roles affected by this standard]
- **Related:** [related standard](relative-link.md), [related ADR](relative-link.md)

## Purpose

Explain why this standard exists in two or three sentences.

## Scope

State what the standard covers and where it applies.

## Non-goals

State what the standard intentionally does not cover.

## Rules

### P1-XX-R1 — Short rule title

- **Level:** MUST | MUST NOT | SHOULD | SHOULD NOT | MAY
- **Rule:** State one testable rule.
- **Rationale:** Explain why the rule exists.
- **Verification:** State whether review, a command, a test, or a future
  automated check verifies the rule.

Add one subsection per rule. Follow
[P1-14: Engineering decisions](../../packages/framework/core/engineering-decisions.md)
for rule IDs and status.

## Examples

Show at least one compliant example and one non-compliant example. Keep the
examples technology-neutral unless this standard explicitly covers a technology
profile.

## Exceptions

Explain how an exception is requested, approved, scoped, and reviewed. If the
standard has no exception process, write `None`.

## Verification

List the checks that apply to this standard. Use `pnpm check` for the repository
gate. If a rule is executable, link to the test that covers it. Follow
[P1-14: Engineering decisions](../../packages/framework/core/engineering-decisions.md)
for verification requirements.

## Related decisions

List related ADRs or standards with relative links.

## Change history

| Version | Date       | Change         |
| ------- | ---------- | -------------- |
| 0.1.0   | YYYY-MM-DD | Initial draft. |

---

This template follows [P1-14: Engineering decisions](../../packages/framework/core/engineering-decisions.md).
