# Core engineering content

Status: **Accepted**.

Phase 1 defines the universal engineering standards. Each work package has one
canonical page here, and all 15 are accepted and binding. P1-14 and P1-01 were
accepted on 2026-11-06; the rest were accepted by the project owner on 2026-11-07.

| ID    | Standard                | Status   | Page                                                     |
| ----- | ----------------------- | -------- | -------------------------------------------------------- |
| P1-01 | Architecture principles | Accepted | [architecture-principles.md](architecture-principles.md) |
| P1-02 | Repository organization | Accepted | [repository-organization.md](repository-organization.md) |
| P1-03 | Code quality            | Accepted | [code-quality.md](code-quality.md)                       |
| P1-04 | Naming                  | Accepted | [naming.md](naming.md)                                   |
| P1-05 | Dependencies            | Accepted | [dependencies.md](dependencies.md)                       |
| P1-06 | Errors and logging      | Accepted | [errors-and-logging.md](errors-and-logging.md)           |
| P1-07 | Configuration           | Accepted | [configuration.md](configuration.md)                     |
| P1-08 | API design              | Accepted | [api-design.md](api-design.md)                           |
| P1-09 | Data design             | Accepted | [data-design.md](data-design.md)                         |
| P1-10 | Testing                 | Accepted | [testing.md](testing.md)                                 |
| P1-11 | Code review             | Accepted | [code-review.md](code-review.md)                         |
| P1-12 | Documentation           | Accepted | [documentation.md](documentation.md)                     |
| P1-13 | Security baseline       | Accepted | [security-baseline.md](security-baseline.md)             |
| P1-14 | Engineering decisions   | Accepted | [engineering-decisions.md](engineering-decisions.md)     |
| P1-15 | Validation contracts    | Accepted | [validation-contracts.md](validation-contracts.md)       |

P1-14 defines the decision-record process and the standard-page format. P1-15
adds the `pnpm validate:standards` check, which verifies page structure, the
content model, and the ADR index; see
[validation contracts](validation-contracts.md).

The Phase 1 scope is described in [the foundation document](../../../VAHU.md) and
the [Phase 1 specification](../../../architecture/specifications/phase-1.md).
Do not add stack-specific rules here; those belong in `technology-profiles/`.
