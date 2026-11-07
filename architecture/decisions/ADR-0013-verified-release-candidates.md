# ADR-0013: Verify release candidates before publication

- **Status:** Accepted
- **Date:** 2026-11-07
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Supersedes:** None
- **Superseded by:** None

## Context

Phase 0 prepared package metadata, a Changesets configuration, and a manual
`release.yml` workflow. That workflow packed three tarballs and uploaded them
without inspecting what it had built. A regression — a packed `workspace:`
range, a missing type declaration, an archived `src/` tree, or a client-only
package slipping into the set — would have been uploaded, and later published,
unnoticed.

The Phase 8 objective includes reproducible releases and package contents that
are inspected before publication. Publication itself is a consequential,
external action: it needs an approved decision, registry ownership, and
credentials that do not belong in the repository.

## Decision

- Keep publication out of scope until a separate, explicit release approval.
- Add `scripts/release/validate-artifacts.ts` as the single way to produce release
  candidates. It packs the approved packages and inspects each archive.
- Enforce a fixed package set (`vahu`, `@vahu-ef/core`, `@vahu-ef/schemas`), a
  readable manifest, `README.md` and `LICENSE`, required package content, existing
  entry points, released (not `workspace:`) dependency ranges, internal versions
  matching their sibling candidate, and the absence of source, tests, source maps,
  environment files, and installed dependencies.
- Emit a SHA-256 `SHA256SUMS` file so a downloaded candidate can be verified with
  `sha256sum -c`.
- Run the validator inside the existing artifact-only workflow instead of adding
  a second packaging path, and keep that workflow manual and read-only.
- Record the compatibility promises in
  `docs/contributing/versioning-and-compatibility.md`.

## Consequences

Positive:

- A candidate that would publish a broken or unsafe artifact fails before upload.
- Reviewers get a reproducible, checksummed artifact set tied to the revision that
  passed `pnpm check`.
- The rules are covered by tests that exercise each failure, not just the happy
  path.
- No credential, token, or publication step is introduced.

Negative and open:

- The checks validate structure and contents, not that the packages install and
  behave correctly on a clean machine. Installation testing remains future work.
- Candidates are packed on Ubuntu only.
- The validator reads tarballs with a small, purpose-built ustar reader rather
  than a general archive library; it supports the subset `pnpm pack` emits and
  should be replaced if packaging ever changes format.
- Publishing, provenance attestation, standalone executables, and signing are
  still unimplemented and unclaimed.

## Alternatives considered

- **Publish on tag from the existing workflow.** Rejected: publication requires
  explicit approval and registry credentials, neither of which is in scope.
- **Rely on `pnpm pack --json` file lists.** Rejected: it reports what the packer
  believes it wrote. Inspecting the archive also verifies the packed manifest,
  which is where a `workspace:` leak appears.
- **Add an archive-parsing dependency.** Rejected for now: the needed subset is
  small, and the repository already prefers minimal dependencies. Revisit if
  packaging gains formats the reader does not handle.
- **Build standalone executables now.** Rejected: the CLI is Node-only ESM, and a
  binary matrix without platform smoke tests would be an unsupported claim.

## Links

- Related ADRs: [ADR-0001](ADR-0001-monorepo-boundaries.md),
  [ADR-0005](ADR-0005-apache-license.md),
  [ADR-0012](ADR-0012-static-website-and-canonical-markdown-documentation.md)
- Affected files or packages: `scripts/release/`, `.github/workflows/release.yml`,
  `package.json`, `tsconfig.json`
- Related specification: [`phase-8.md`](../specifications/phase-8.md)

## Approval

- **Approved by:** VAHU project owner
- **Approved on:** 2026-11-07
- **Review date:** None

## Notes

Implementation record: artifact validator with unit tests, `pnpm release:pack`
and `pnpm release:validate`, `SHA256SUMS` output, workflow integration, and the
versioning and compatibility policy.
