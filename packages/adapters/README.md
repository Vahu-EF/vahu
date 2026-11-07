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
`renderGeneric`. Rendering is deterministic and writes no files; generation and
synchronization arrive with the engine that previews diffs and preserves user
content.

No provider adapter is implemented or compatibility-tested. Do not generate
adapter output and call it compatible without verification.
