# Framework content

`packages/framework/` contains reusable engineering knowledge. It is intentionally
mostly Markdown, JSON, and YAML so people can use it without installing the CLI.

| Area                   | Status      | Purpose                                                 |
| ---------------------- | ----------- | ------------------------------------------------------- |
| `core/`                | In Progress | Universal standards; P1-14 accepted, P1-01 draft        |
| `agents/`              | Planned     | Agent-neutral instructions, rules, skills, and commands |
| `technology-profiles/` | Planned     | Canonical stack-specific profiles                       |
| `workflows/`           | Planned     | Planning, implementation, review, and release workflows |
| `documentation/`       | Planned     | Documentation and ADR conventions                       |
| `quality/`             | Planned     | Testing, static analysis, and review gates              |
| `security/`            | Planned     | Security baselines and review guidance                  |
| `cicd/`                | Planned     | CI/CD conventions and reusable templates                |

Phase 0 created the boundaries. Phase 1 has P1-14 accepted:
[engineering decisions](../../packages/framework/core/engineering-decisions.md).
P1-01 is a [draft](../../packages/framework/core/architecture-principles.md) and
awaits owner acceptance.

Do not describe a planned module as available. Framework content must not
import CLI code. If a rule needs executable validation, put the reusable logic
in `packages/core/` and keep the rule text in the framework module.
