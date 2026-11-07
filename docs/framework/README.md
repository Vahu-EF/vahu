# Framework content

`packages/framework/` contains reusable engineering knowledge. It is intentionally
mostly Markdown, JSON, and YAML so people can use it without installing the CLI.

The [content model](../../packages/framework/CONTENT_MODEL.md) defines the
metadata, discovery, dependency, and composition contract for framework
content. `pnpm validate:standards` enforces it.

| Area                   | Status   | Purpose                                                 |
| ---------------------- | -------- | ------------------------------------------------------- |
| `core/`                | Accepted | 15 universal standards, all accepted                    |
| `agents/`              | Planned  | Agent-neutral instructions, rules, skills, and commands |
| `technology-profiles/` | Planned  | Canonical stack-specific profiles                       |
| `workflows/`           | Planned  | Planning, implementation, review, and release workflows |
| `documentation/`       | Planned  | Documentation and ADR conventions                       |
| `quality/`             | Planned  | Testing, static analysis, and review gates              |
| `security/`            | Planned  | Security baselines and review guidance                  |
| `cicd/`                | Planned  | CI/CD conventions and reusable templates                |

Phase 0 created the boundaries. Phase 1 is complete: all 15 standards in
[the core index](../../packages/framework/core/README.md) are accepted and
binding, including
[engineering decisions](../../packages/framework/core/engineering-decisions.md)
and [architecture principles](../../packages/framework/core/architecture-principles.md).

Do not describe a planned module as available. Framework content must not
import CLI code. If a rule needs executable validation, put the reusable logic
in `packages/core/` and keep the rule text in the framework module.
