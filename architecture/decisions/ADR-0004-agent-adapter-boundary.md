# ADR-0004: Keep agent content neutral and translate through adapters

- **Status:** Accepted
- **Date:** 2026-11-06

## Context

Different AI coding agents use different instruction files, capability models,
and command formats. VAHU must not make one agent’s format the internal model or
pretend that every agent supports the same features.

## Decision

Framework content uses an agent-neutral model:

```text
Instructions
Rules
Skills
Commands
Context
Tool requirements
```

An adapter translates that model into a target agent’s supported format. Each
adapter must document:

- supported features;
- unsupported features;
- generated file conventions;
- compatibility requirements;
- version-specific behavior;
- validation steps.

When a capability cannot be translated, the adapter reports the limitation. It
must not silently discard content.

Phase 0 creates the boundary and planned adapter folders only. No adapter is
declared supported until it is implemented and tested against the target agent.

## Consequences

- The framework remains reusable across agents.
- Adapter tests become a release requirement.
- Generic Markdown content remains the fallback when no adapter exists.
