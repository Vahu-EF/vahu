# Workflows

Status: **Contracts and lifecycle definitions implemented; no workflow runner.**

`workflows/` contains agent-neutral lifecycle workflow definitions, and `gates/`
contains profile-aware quality gate definitions. Both are strict JSON validated
by schemas from `@vahu-ef/schemas`. `@vahu-ef/core` checks catalog references and
evaluates caller-supplied results with explicit evidence and approvals; it never
executes the commands in a gate.

Run `pnpm validate:workflows` to validate every definition and cross-reference.
See [Phase 5](../../../architecture/specifications/phase-5.md) and
[ADR-0010](../../../architecture/decisions/ADR-0010-agent-neutral-workflows-and-gate-evidence.md)
for the contract, status semantics, and limitations.

A workflow being defined does not mean it was run. Missing evidence is never
reported as passed, and owner approval is never inferred.
