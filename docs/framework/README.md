# Framework content

`packages/framework/` contains reusable engineering knowledge. It is intentionally
mostly Markdown, JSON, and YAML so people can use it without installing the CLI.

The [content model](../../packages/framework/CONTENT_MODEL.md) defines the
metadata, discovery, dependency, and composition contract for framework
content. `pnpm validate:standards` enforces it.

| Area                   | Status      | Purpose                                                                          |
| ---------------------- | ----------- | -------------------------------------------------------------------------------- |
| `core/`                | Accepted    | 15 universal standards, all accepted                                             |
| `agents/`              | In Progress | Canonical agent definitions and a generic Markdown renderer; no provider adapter |
| `technology-profiles/` | In Progress | Validated JSON format and three initial profiles                                 |
| `workflows/`           | In Progress | Fourteen lifecycle workflows and thirteen gates; no command runner               |
| `documentation/`       | Planned     | Documentation and ADR conventions                                                |
| `quality/`             | Planned     | Additional reusable testing and review standards                                 |
| `security/`            | Planned     | Additional security-baseline content                                             |
| `cicd/`                | Planned     | CI/CD conventions and reusable templates                                         |

Phases 0–6 established the workspace, accepted standards, onboarding,
provider-neutral agent definitions, technology profiles, workflows/gates, and
initial read-only CLI reports. Their coverage remains partial where each phase
specification says so. Phase 1 is complete: all 15 standards in
[the core index](../../packages/framework/core/README.md) are accepted and
binding, including
[engineering decisions](../../packages/framework/core/engineering-decisions.md)
and [architecture principles](../../packages/framework/core/architecture-principles.md).

Do not describe a planned module as available. Framework content must not
import CLI code. If a rule needs executable validation, put the reusable logic
in `packages/core/` and keep the rule text in the framework module.
