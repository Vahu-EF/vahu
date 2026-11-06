# Architecture decisions

| ID                                             | Decision                                                                 | Status   |
| ---------------------------------------------- | ------------------------------------------------------------------------ | -------- |
| [ADR-0001](ADR-0001-monorepo-boundaries.md)    | Use a pnpm monorepo with explicit package boundaries                     | Accepted |
| [ADR-0002](ADR-0002-typescript-toolchain.md)   | Use strict TypeScript, tsup, Vitest, ESLint, and Prettier                | Accepted |
| [ADR-0003](ADR-0003-configuration-contract.md) | Keep one versioned project configuration contract in `packages/schemas`  | Accepted |
| [ADR-0004](ADR-0004-agent-adapter-boundary.md) | Keep agent content neutral and put translations behind adapters          | Accepted |
| [ADR-0005](ADR-0005-apache-license.md)         | Use Apache License 2.0 without asserting an unconfirmed copyright holder | Accepted |

## Format

Each ADR has a status, context, decision, consequences, and links to affected
files. A later decision can supersede an earlier one; do not delete the history.
