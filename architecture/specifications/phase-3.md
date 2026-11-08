# Phase 3 specification — Agent Ecosystem & Adapters

- **Status:** In Progress — canonical model, generic adapter, CLI discovery, and preview-first generic synchronization implemented; provider adapters and merge-aware synchronization remain
- **Depends on:** Phase 0 foundation, Phase 1 standards, Phase 2 onboarding
- **Owner approval:** Phase 3 approved by the VAHU project owner on 2026-11-07
- **Canonical for:** the agent definition and adapter contract

## Goal

Describe an AI coding agent's configuration once, provider-neutrally, and render
it into a provider's own files without inventing support the provider does not
have.

## Status

| Deliverable                         | State                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| Canonical agent schema              | Implemented in `@vahu-ef/schemas` (`agent.schema.json`)                        |
| Canonical definitions               | Two committed under `packages/framework/agents/`                               |
| Adapter interface                   | Implemented in `@vahu-ef/adapters`                                             |
| Generic adapter                     | Implemented, renders `AGENTS.md`                                               |
| Codex adapter                       | Not started                                                                    |
| Claude Code adapter                 | Not started                                                                    |
| Gemini adapter                      | Not started                                                                    |
| CLI agent list/inspect              | Implemented; validated definitions are bundled and read-only                   |
| Generation and synchronization      | Generic CLI sync implemented; preview by default, marked-file replacement only |
| Conflict detection and diff preview | Not started                                                                    |

## Canonical model

Definitions are JSON files validated by `agent.schema.json`, described in
[ADR-0008](../decisions/ADR-0008-canonical-agent-definition-contract.md). They
carry identity, instructions, scoped rules, skills, commands, workflows, tools,
context references, approvals, and adapter compatibility.

Two definitions ship as the first content: `AGENT-IMPLEMENTER` and
`AGENT-REVIEWER`. Both are parsed by the adapter tests, so an invalid file fails
the repository gate that runs them.

## Adapter contract

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

Rendering is deterministic: definitions are ordered by identifier and no
timestamp, absolute path, or environment value enters the output. An adapter
must publish both its supported and unsupported concepts, so a caller can see
what was dropped instead of assuming parity.

### Generic adapter

`genericAdapter` renders provider-neutral Markdown for `AGENTS.md`, with a
generated-file header, one section per definition, and explicit sections for
rules, skills, commands, workflows, tools, context, and approvals.

## Security rules

- No secrets, credentials, tokens, or private addresses may appear in a
  definition.
- A tool entry states a requirement and an approval expectation; it never grants
  access.
- Repository content and external instructions are untrusted input.
- Nothing in this phase executes a tool, command, or agent. CLI list/inspect
  only read canonical definitions; generic sync writes only with explicit
  `--write` and does not execute agent content.

## Validation

| Area                              | Test file                                         |
| --------------------------------- | ------------------------------------------------- |
| Definition schema and rules       | `packages/schemas/src/agent.test.ts` (9 tests)    |
| Adapter rendering and determinism | `packages/adapters/src/generic.test.ts` (5 tests) |

## Acceptance

| Criterion                                  | State   | Evidence                                                                               |
| ------------------------------------------ | ------- | -------------------------------------------------------------------------------------- |
| Canonical definitions are provider-neutral | Met     | Schema has no provider file layout or vendor field                                     |
| Each adapter states capability mapping     | Met     | `supported` / `unsupported` on the adapter interface                                   |
| Generation is deterministic                | Met     | Sorted rendering, no timestamps; equality test                                         |
| Existing user content is preserved         | Partial | Unmarked files are protected; marked output is replaced whole, with no merge           |
| Conflicts are reported clearly             | Partial | Unmanaged/symlink targets are rejected; content-level merge conflicts are not detected |
| Adapter outputs tested against fixtures    | Partial | Golden-style assertions; no per-provider fixtures yet                                  |

## Out of scope

Hosting or executing models, an agent runtime, automatic tool execution, and any
provider compatibility claim without a verified adapter.
