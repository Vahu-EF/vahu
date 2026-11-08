# Agent adapters

Status: **Generic adapter implemented; provider adapters planned.**

Adapters translate VAHU's canonical agent definitions into a target agent's
supported format. An adapter must document supported features, unsupported
features, file conventions, compatibility, and validation.

| Adapter       | Target                    | Status      |
| ------------- | ------------------------- | ----------- |
| `generic`     | Provider-neutral Markdown | Implemented |
| `codex`       | OpenAI Codex              | Planned     |
| `claude-code` | Claude Code               | Planned     |
| `gemini`      | Gemini CLI                | Planned     |

The package exports the `AgentAdapter` interface, `genericAdapter`, and
`renderGeneric`. Rendering is deterministic and writes no files. The VAHU CLI
uses the generic adapter for preview-first `agents sync`; it writes only when
`--write` is provided and refuses to replace files that lack the generated-file
marker. It does not merge manual content into a generated file.

No provider adapter is implemented or compatibility-tested. Do not generate
adapter output and call it compatible without verification.
