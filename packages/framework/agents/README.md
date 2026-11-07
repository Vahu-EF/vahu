# Canonical agent definitions

Agent definitions are provider-neutral JSON files validated by
`agent.schema.json`. An adapter renders them into a provider's format; the
definitions themselves never mention a provider file layout.

| Definition               | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| `AGENT-IMPLEMENTER.json` | Implements a scoped change with tests           |
| `AGENT-REVIEWER.json`    | Reviews a change against the accepted standards |

## Format

- `id` is stable and upper-case: `AGENT-REVIEWER`.
- `rules` are scoped to a `project`, `repository`, `path`, or `package`; a
  scoped rule must carry a `path`, and a project or repository rule must not.
- `tools` state whether they are required and what approval they need. Defining
  a tool never grants access to it.
- `compatibility.adapters` lists the adapters expected to express the definition.

No definition may contain secrets, credentials, or private addresses.

## Validation

`packages/adapters/src/generic.test.ts` parses every definition in this
directory, so an invalid file fails CI. Dedicated provider adapters and a
repository gate arrive with the adapter changes they validate.
