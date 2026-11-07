# ADR-0010: Define agent-neutral workflows and evidence-based quality gates

- **Status:** Accepted
- **Date:** 2026-11-07
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Supersedes:** None
- **Superseded by:** None

## Context

Phase 5 asks for lifecycle workflows, quality gates, and explicit human approval
checkpoints. Without a contract, an agent could call a skipped check passed, hide
which profile introduced a gate, or treat a missing approval as consent.

The workflow and gate formats are durable framework contracts; P1-14-R7
therefore requires this decision before implementation.

## Decision

Represent workflows and quality gates as strict, provider-neutral JSON contracts.
Gate execution is outside this contract: an agent or external runner supplies a
result, and `@vahu-ef/core` evaluates it against the required evidence and
approvals. The evaluator never executes a command.

### Workflow format

A workflow defines a purpose, trigger, prerequisites, required context, inputs,
ordered steps, outputs, approval checkpoints, quality gate IDs, recovery
behaviour, and related standards and profiles. Step IDs are stable within the
workflow. Definitions do not name an agent provider.

### Quality gate format

A quality gate defines its kind, description, optional command, severity
(`blocking` or `advisory`), profile applicability, and whether evidence is
required. A gate with no `applicableProfiles` applies whenever the workflow
requires it. A scoped gate applies only when at least one of its profiles is
selected. Supplying a result for a non-applicable gate is an error.

### Evaluation rules

- A required blocking gate without a result is `blocked`.
- A blocking gate without required evidence is `blocked` even if its reported
  outcome is `passed`.
- A failed blocking gate yields `failed`; a skipped or blocked blocking gate
  yields `blocked`.
- Advisory failures, skips, or missing results yield `passed-with-warnings`, not
  a clean pass; advisory findings do not block.
- Every approval checkpoint needs an explicit decision, a named approver, and
  evidence. Missing or incomplete approval is `blocked`; rejection is `failed`.
- Duplicate, unexpected, or inapplicable results are blocked and reported.
- A workflow can be `passed` only when every applicable blocking gate has a
  passed result with required evidence and every required approval is recorded.

The evaluator consumes evidence supplied by the caller. It does not attest that
the command or human action actually occurred beyond the evidence submitted; that
limitation is part of the result contract and must remain visible.

## Consequences

Positive:

- One workflow contract is consumable by different agents.
- A missing check or owner decision cannot silently become a pass.
- Profile-aware gates are reusable without imposing irrelevant checks on every
  project.
- The evaluator is deterministic and side-effect-free.

Negative and open:

- There is no command runner or CLI for supplying results; Phase 6 may add one.
- Evidence is caller-supplied and not cryptographically attested.
- Fourteen workflow definitions describe the lifecycle, and thirteen gates are
  declared, but neither is executable by the evaluator.

## Alternatives considered

- **Let each agent infer its own workflow format.** Rejected: status and approval
  semantics would drift across providers.
- **Execute quality-gate commands inside the core evaluator.** Rejected: `core`
  must stay testable and free of process-execution policy, and projects have
  different runtimes and permissions.
- **Treat missing or skipped evidence as a warning.** Rejected for blocking
  checks: absence of evidence is not evidence of success.
- **Automatically approve human checkpoints when a workflow reaches them.**
  Rejected: approval belongs to the named human owner.

## Links

- Related ADRs: [ADR-0003](ADR-0003-configuration-contract.md),
  [ADR-0008](ADR-0008-canonical-agent-definition-contract.md),
  [ADR-0009](ADR-0009-technology-profile-contract.md)
- Affected files or packages: `packages/schemas/src/workflow.ts`,
  `packages/core/src/workflows.ts`, `packages/framework/workflows/`
- Related specification: [`phase-5.md`](../specifications/phase-5.md)
- Related standard: [P1-14: Engineering decisions](../../packages/framework/core/engineering-decisions.md)

## Approval

- **Approved by:** VAHU project owner
- **Approved on:** 2026-11-07
- **Review date:** None

## Notes

Implementation record: workflow and quality-gate schemas with generated JSON
Schema; 14 lifecycle workflows; 13 generic and profile-aware gates; catalog
validation in `@vahu-ef/core`; evidence-based evaluation; and
`pnpm validate:workflows` wired into `pnpm check`.
