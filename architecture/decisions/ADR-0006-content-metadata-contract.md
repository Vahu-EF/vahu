# ADR-0006: Adopt a content metadata contract for framework content

- **Status:** Proposed
- **Date:** 2026-11-07
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Supersedes:** None
- **Superseded by:** None

## Context

Framework content is Markdown under `packages/framework/`. Until now it had no
machine-readable identity or applicability: nothing could tell a project whether
a page applied to it, nothing recorded which item another item depends on, and
no check could prove that a page followed its own format.

The Roadmap's Phase 1 asks for a canonical content model. P1-14-R7 requires an
ADR for a decision that changes a file format or compatibility promise, and the
metadata fields added to standard pages are exactly that: every future content
page must carry them.

Two designs were available:

1. Add a new front-matter block that restates identity, status, version, and
   owner alongside a content-specific block.
2. Extend the existing P1-14 page header with the fields that are not already
   present, and derive the rest.

## Decision

Adopt a content metadata contract that **extends** the P1-14 standard-page
header instead of duplicating it.

- A standard page keeps `Standard ID`, `Status`, `Version`, `Owner`, and
  `Approver`; a non-standard page declares `Content ID` with the same status,
  version, and owner fields.
- Five fields are declared on every content page: `Content type`,
  `Lifecycle stages`, `Project types`, `Depends on`, and `Tags`.
  `Deprecation` is required when the item is deprecated.
- `id`, `title`, `description`, `status`, `origin`, and `enforcement` are
  derived by the parser. Enforcement is derived from the strongest rule level in
  the page, so it cannot drift from the rules the page states.
- Statuses map `Draft → draft`, `Accepted → stable`, `Superseded/Retired →
deprecated`; non-standard pages use the four content statuses directly.
- Dependencies form a directed acyclic graph and are validated as such.
- Composition uses fixed precedence: mandatory (0), explicit project override
  (1), profile (2), practice (3), recommended (4), optional (5). A project
  override cannot disable a mandatory item.

The contract is implemented in `@vahu-ef/schemas` (`content.ts`,
`content.schema.json`) and `@vahu-ef/core` (`content.ts`, `framework.ts`), and
enforced by `pnpm validate:standards`, which also runs in CI.

## Consequences

Positive:

- One vocabulary for content identity, status, and applicability, checked by a
  gate rather than by review alone.
- Existing pages were extended, not rewritten, so the P1-14 format and its
  accepted rules remain intact.
- A project can select content from its own configuration because `Project
types` uses the configuration schema's project types.

Negative and open:

- Adding a field to every content page is a maintenance cost on authors.
- Discovery currently covers only `packages/framework/`. Templates, docs, and
  examples are outside it, and adding a root is itself a contract change.
- The composition function is tested but no command applies it to a project
  configuration yet.
- This ADR is `Proposed`; the acceptance it describes is not yet recorded.

## Alternatives considered

- **A separate metadata block or sidecar file per page.** Rejected: it restates
  identity and status, which is the duplication P1-14-R13 prohibits, and it
  drifts immediately.
- **Front-matter in a new format (for example JSON or YAML) on every page.**
  Rejected for now: it would replace the readable P1-14 header and create a
  second way to declare the same values.
- **No machine-readable contract; rely on review.** Rejected: the roadmap's
  acceptance criteria require validation that catches malformed metadata and
  broken references, and review cannot prove absence.

## Links

- Related ADR: [ADR-0003](ADR-0003-configuration-contract.md) (one versioned
  contract, owned by `packages/schemas`)
- Affected files or packages: `packages/schemas/src/content.ts`,
  `packages/core/src/content.ts`, `packages/framework/CONTENT_MODEL.md`
- Related standard: [P1-15: Validation contracts](../../packages/framework/core/validation-contracts.md)

## Approval

- **Approved by:** Pending
- **Approved on:** Pending
- **Review date:** None

## Notes

The schema is versioned with the package; a breaking metadata change needs a new
schema version and a migration, following ADR-0003's rule for configuration.
