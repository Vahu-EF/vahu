# ADR-0008: Define a provider-neutral canonical agent contract

- **Status:** Accepted
- **Date:** 2026-11-07
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Supersedes:** None
- **Superseded by:** None

## Context

Phase 3 asks for a canonical model of AI coding agent configuration and adapters
that render it per provider. The repository had only placeholder adapter folders
and no definition format, so any generated `AGENTS.md`, `CLAUDE.md`, or Gemini
file would have been invented per provider, which is exactly the lock-in VAHU is
supposed to avoid ([ADR-0004](ADR-0004-agent-adapter-boundary.md)).

A file format and a new package are contract changes, so P1-14-R7 requires this
record before the implementation lands.

## Decision

Adopt **JSON agent definitions** as the canonical representation, validated by
`agent.schema.json`, and a small **adapter interface** in `@vahu-ef/adapters`.

### Canonical definition

A definition lives under `packages/framework/agents/` and carries:

- `id` (`AGENT-REVIEWER`), `name`, `description`, `version`, and a
  `schemaVersion`;
- `instructions` — project-level guidance;
- `rules` — scoped by `project`, `repository`, `path`, or `package`; a scoped rule
  must name its `path`, and a project or repository rule must not;
- `skills`, `commands`, and `workflows` with their steps;
- `tools` with `required` and `approval` (`always`, `on-write`, `never`). Declaring
  a tool never grants access to it;
- `context` references;
- `approvals` — decisions that stay with a person;
- `compatibility.adapters` — the adapters expected to express the definition.

The schema is separate from the project configuration: it versions content
(`1.0.0`), not a project's `.vahu/project.json`.

### Adapter contract

```ts
interface AgentAdapter {
  id: 'generic' | 'codex' | 'claude-code' | 'gemini';
  name: string;
  outputPath: string;
  supported: readonly string[];
  unsupported: readonly string[];
  render(definitions: readonly AgentDefinition[]): string;
}
```

An adapter must state what it cannot express. Rendering is deterministic:
definitions are ordered by identifier, and no timestamp, path, or environment
value is embedded, so identical input produces identical bytes.

### Generic adapter

`@vahu-ef/adapters` ships one adapter, `generic`, which renders provider-neutral
Markdown for `AGENTS.md` and states that it supports every canonical concept.
It is the reference output and the fixture every later adapter is compared
against.

### Security

- Definitions must not contain secrets, credentials, or private addresses, and
  no field accepts free-form environment values.
- Tool entries describe requirements and approval expectations; no adapter may
  translate them into a granted permission.
- Repository content and external instructions stay untrusted input.

## Consequences

Positive:

- One canonical format with a committed JSON Schema and tests for every
  definition in the repository.
- A new adapter is additive: implement `render`, declare capabilities, add
  fixture tests. Nothing else changes.
- Tool and approval semantics are explicit before any provider mapping exists.

Negative and open:

- A new workspace package (`@vahu-ef/adapters`) to build, test, and release.
- Only the generic adapter exists. Codex, Claude Code, and Gemini adapters are
  not implemented, and no provider is claimed compatible.
- Generation, synchronization, conflict detection, and diff preview are not
  implemented; adapters only render strings.
- The schema is `1.0.0` and has no migration story yet, because nothing
  persisted depends on it.

## Alternatives considered

- **Markdown with front matter as the canonical format.** Rejected for now: the
  adapters would parse prose, and validating rules, scopes, and tool approval
  would be guesswork.
- **One canonical file per provider.** Rejected: it duplicates the same intent
  four times and drifts immediately, the failure ADR-0004 exists to prevent.
- **Store definitions inside `.vahu/project.json`.** Rejected: project
  configuration records a project's decisions, not reusable framework content,
  and the two have different lifecycles.
- **Ship provider adapters first and infer the model.** Rejected: the model would
  become whichever provider was implemented first.

## Links

- Related ADR: [ADR-0004](ADR-0004-agent-adapter-boundary.md) (canonical content
  stays neutral; translations live in adapters)
- Affected files or packages: `packages/schemas/src/agent.ts`,
  `packages/schemas/agent.schema.json`, `packages/adapters/src/generic.ts`,
  `packages/framework/agents/`
- Related specifications: [`phase-3.md`](../specifications/phase-3.md)
- Related standards: [P1-12: Documentation](../../packages/framework/core/documentation.md)

## Approval

- **Approved by:** VAHU project owner
- **Approved on:** 2026-11-07
- **Review date:** None

## Notes

Implementation record:

- `agentDefinitionSchema` and `parseAgentDefinition` in `@vahu-ef/schemas`, with
  `agent.schema.json` generated alongside the project and content schemas.
- `@vahu-ef/adapters` provides the `AgentAdapter` interface and `genericAdapter`.
- Two canonical definitions (`AGENT-IMPLEMENTER`, `AGENT-REVIEWER`) are committed;
  the adapter tests parse them, so an invalid definition fails CI.
- Codex, Claude Code, and Gemini adapters remain unimplemented, and no
  compatibility claim is made for them.
