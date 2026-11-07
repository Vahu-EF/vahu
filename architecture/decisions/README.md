# Architecture decisions

Architecture decisions follow [P1-14: Engineering decisions](../../packages/framework/core/engineering-decisions.md).
New records start from the [ADR template](../../templates/documentation/adr.md).

| ID                                                | Decision                                                                 | Status   |
| ------------------------------------------------- | ------------------------------------------------------------------------ | -------- |
| [ADR-0001](ADR-0001-monorepo-boundaries.md)       | Use a pnpm monorepo with explicit package boundaries                     | Accepted |
| [ADR-0002](ADR-0002-typescript-toolchain.md)      | Use strict TypeScript, tsup, Vitest, ESLint, and Prettier                | Accepted |
| [ADR-0003](ADR-0003-configuration-contract.md)    | Keep one versioned project configuration contract in `packages/schemas`  | Accepted |
| [ADR-0004](ADR-0004-agent-adapter-boundary.md)    | Keep agent content neutral and put translations behind adapters          | Accepted |
| [ADR-0005](ADR-0005-apache-license.md)            | Use Apache License 2.0 without asserting an unconfirmed copyright holder | Accepted |
| [ADR-0006](ADR-0006-content-metadata-contract.md) | Extend the P1-14 page header into a validated content metadata contract  | Proposed |

## Lifecycle

| Status       | Meaning                                                  |
| ------------ | -------------------------------------------------------- |
| `Proposed`   | Drafted and waiting for approval. Not binding.           |
| `Accepted`   | Approved and binding.                                    |
| `Superseded` | Replaced by a newer ADR; kept for history.               |
| `Rejected`   | Considered and not adopted; kept when the history helps. |
| `Deprecated` | Still recorded, but no longer recommended for new work.  |

## Ownership and approval

Every new ADR names an owner and an approver. The owner keeps the record
current. The approver accepts, rejects, supersedes, or deprecates it. When one
person holds both roles, record that explicitly.

A new ADR starts as `Proposed`. It becomes `Accepted` only after the approver
records the date and version.

## Required sections

A new ADR contains:

- status, date, owner, approver, and supersession links;
- `Context`;
- `Decision`;
- `Consequences`;
- the affected files or packages;
- an approval record.

`Alternatives considered` is required when realistic alternatives existed.
The template includes it with a `None` option.

## Existing records

ADR-0001 through ADR-0005 predate P1-14. They remain accepted. They may add
owner, approver, or supersession fields when next changed, but they do not need
a format-only rewrite.

## Changing a decision

Create a new ADR and mark the old one `Superseded`. Link both records with
`Supersedes` and `Superseded by`. Do not delete an accepted record. Keep the
index current in the same change.
