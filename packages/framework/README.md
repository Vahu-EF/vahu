# Framework content

Reusable VAHU engineering knowledge lives here. It must be useful without the
CLI and must not import CLI code.

How content is identified, discovered, and composed is specified in the
[content model](CONTENT_MODEL.md). Every page in this tree is checked by
`pnpm validate:standards` against that contract.

| Area                   | Status   | Scope                                                   |
| ---------------------- | -------- | ------------------------------------------------------- |
| `core/`                | Accepted | 15 universal standards, all accepted                    |
| `agents/`              | Planned  | Agent-neutral instructions, rules, skills, and commands |
| `technology-profiles/` | Planned  | The only canonical profile tree                         |
| `workflows/`           | Planned  | Planning, implementation, review, and release workflows |
| `documentation/`       | Planned  | README, wiki, ADR, and API documentation conventions    |
| `quality/`             | Planned  | Tests, static analysis, and quality gates               |
| `security/`            | Planned  | Security baselines and review guidance                  |
| `cicd/`                | Planned  | CI/CD conventions and templates                         |

Phase 0 established the boundaries. Phase 1 is complete: all 15 standards in
[`core/`](core/README.md) are accepted, including
[engineering decisions](core/engineering-decisions.md),
[architecture principles](core/architecture-principles.md),
[code quality](core/code-quality.md), and
[validation contracts](core/validation-contracts.md). P1-14 and P1-01 were
accepted on 2026-11-06; the rest on 2026-11-07. The other framework modules
remain planned and are not claimed as complete.
