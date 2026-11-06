# Agent adapters

Status: **Planned**.

Adapters translate VAHU’s agent-neutral content into a target agent’s supported
format. An adapter must document supported features, unsupported features, file
conventions, compatibility, and validation.

| Folder         | Target                        | Status  |
| -------------- | ----------------------------- | ------- |
| `generic/`     | Generic Markdown instructions | Planned |
| `codex/`       | OpenAI Codex                  | Planned |
| `claude-code/` | Claude Code                   | Planned |
| `gemini/`      | Gemini CLI                    | Planned |

No target is tested or supported in Phase 0. Do not generate adapter output and
call it compatible without verification.
