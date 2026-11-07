# Phase 5 specification — Engineering Workflows & Quality Gates

- **Status:** In Progress — contracts, lifecycle workflows, and evidence evaluator implemented
- **Depends on:** Phases 1–4
- **Owner approval:** Phase 5 scope and this specification approved by the VAHU project owner on 2026-11-07
- **Decision:** [ADR-0010](../decisions/ADR-0010-agent-neutral-workflows-and-gate-evidence.md), accepted 2026-11-07
- **Canonical for:** workflow and quality-gate contract status

## Goal

Make VAHU's engineering lifecycle available as reusable, agent-neutral workflow
content, with quality results and human approvals evaluated explicitly rather
than inferred.

## Scope and design

The approved source scope is Phase 5 in the
[roadmap](roadmap.md#phase-5--engineering-workflows--quality-gates). The
file-format and evaluation decision is recorded in ADR-0010. This specification
records implementation status; it does not duplicate every workflow step.

Workflows and gates are strict JSON under `packages/framework/workflows/`,
validated by `workflow.schema.json` and `quality-gate.schema.json` in
`@vahu-ef/schemas`. Their evaluator lives in `@vahu-ef/core`, accepts caller-
supplied results and evidence, and never executes a command. Workflow definitions
are agent-neutral; their `relatedProfiles` and gates' `applicableProfiles`
connect them to Phase 4 without selecting profiles by default.

## Deliverables

| Deliverable                     | State                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Workflow and gate schemas       | Implemented                                                                    |
| Lifecycle workflow set          | 14 workflows, all lifecycle activities represented                             |
| Quality gate definitions        | 13 gates, including generic and profile-scoped examples                        |
| Catalog validation              | Implemented: schema, unique IDs, valid gate references                         |
| Gate and approval evaluator     | Implemented in core; no command execution                                      |
| Owner approval checkpoints      | Explicit workflow data; requires named approver and evidence                   |
| Automated tests                 | Schema, catalog, pass/fail/skipped/blocked, evidence, approvals, applicability |
| CLI runner or command execution | Not started; explicitly outside this increment                                 |

## Evaluation semantics

- Missing result for a required blocking gate is `blocked`, never passed.
- Missing required evidence for a blocking gate is `blocked`, even when the
  caller reports `passed`.
- A failed blocking gate or rejected owner approval is `failed`.
- A blocked/skipped blocking gate or missing/incomplete approval is `blocked`.
- Advisory gate issues produce `passed-with-warnings`; they remain visible and
  cannot be mistaken for a clean `passed` result.
- Profile-scoped gates are evaluated only when an applicable profile is selected;
  supplying a result for an inapplicable gate blocks the evaluation.
- `passed` requires all applicable blocking gates and approvals to pass with
  evidence.

The evaluator validates what the caller supplied; it cannot independently prove
a command ran or a person approved it. That limitation must be included wherever
its results are surfaced.

## Validation

```bash
pnpm validate:workflows
```

The gate validates every workflow and quality-gate JSON file, unique workflow,
step, and gate identifiers, and workflow references to known gates. The logic is
in `packages/core/src/workflows.ts`, covered by
`packages/core/src/workflows.test.ts` and `packages/schemas/src/workflow.test.ts`,
and wired into `pnpm check` and CI.

## Acceptance

| Criterion                                       | State   | Evidence                                                     |
| ----------------------------------------------- | ------- | ------------------------------------------------------------ |
| Every workflow has explicit inputs and outputs  | Met     | Required schema fields; 14 lifecycle workflows               |
| Workflows can be adapted to multiple agents     | Met     | Provider-neutral data; no agent-specific fields              |
| Quality gates are profile-aware                 | Met     | `applicableProfiles`; evaluator checks selected profiles     |
| Failed gates cannot be reported as passed       | Met     | Tested failed, missing evidence, skipped, and blocked cases  |
| Approval requirements are visible and enforced  | Met     | Required checkpoint needs decision, named approver, evidence |
| Gate evaluation executes the configured command | Not met | Deliberately no execution; caller supplies results           |
| Evidence is independently attested              | Not met | Caller-supplied evidence is not cryptographically verified   |

## Out of scope

This increment does not run shell commands, install tools, create a CLI workflow
runner, or attest that caller-supplied evidence is genuine. Those are separate
product/security decisions. Workflows describe actions, not tool permissions;
production deployment and public release remain explicit human checkpoints.
