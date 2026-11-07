# ADR-0012: Keep the website static and Markdown documentation canonical

- **Status:** Accepted
- **Date:** 2026-11-07
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Supersedes:** None
- **Superseded by:** None

## Context

Phase 7 needs a public-facing website and documentation that reflects actual
repository behavior. `apps/website/` already contains a dependency-free static
site and reproducible GitHub Pages build. Detailed guides already live as
Markdown in `docs/`, while the homepage is a stale Phase 0 placeholder.

Adding a framework or generating a parallel copy of every Markdown guide would
increase maintenance and create competing sources of truth before the current
content has been brought up to date. The project owner approved a bounded first
milestone: improve the current static site, refresh implementation-facing docs,
and ensure committed example configurations are validated.

## Decision

- Keep `apps/website/` a dependency-free static HTML/CSS application built into
  `dist/` for GitHub Pages.
- Keep detailed documentation canonical in Markdown under `docs/`,
  `architecture/`, and `examples/`; the website links to those sources rather
  than maintaining duplicated long-form documentation.
- The homepage may summarize current capabilities and status, but claims must
  match the repository and link to the canonical record.
- Tests must validate website source requirements and ensure the built Pages
  artifact contains the updated content.
- Validate every `examples/*/.vahu/project.json` through the real CLI
  integration test. Examples are configuration fixtures, not production apps.
- GitHub Pages deployment remains an explicit workflow action. This decision
  and implementation do not publish or enable Pages.

## Consequences

Positive:

- The site is easy to build and deploy without adding runtime dependencies.
- Detailed content has one canonical Markdown source; the homepage points users
  to it.
- Website claims and example configuration validity are checked in CI.
- No adoption metrics, testimonials, customer logos, or unverified provider
  compatibility claims are introduced.

Negative and open:

- GitHub-hosted Markdown pages are the documentation destination; this is not a
  rendered documentation site with local routing or search.
- There is no automated full WCAG audit or visual-regression suite in this
  milestone; semantic structure, focus styling, responsive rules, and reduced
  motion are checked by source-level tests and review.
- Examples are configuration-only, not runnable product applications.

## Alternatives considered

- **Adopt a site generator now.** Rejected for the first milestone: the existing
  static app meets the current content need and a generator would add dependency
  and migration scope before evidence shows it is needed.
- **Copy all docs into website HTML.** Rejected: duplicated prose would drift
  from the canonical Markdown source.
- **Publish Pages as part of this work.** Rejected: publication is an external
  state change and is not part of the user's request to implement and merge the
  phase work.

## Links

- Related ADRs: [ADR-0003](ADR-0003-configuration-contract.md),
  [ADR-0009](ADR-0009-technology-profile-contract.md),
  [ADR-0011](ADR-0011-cli-read-only-reports.md)
- Affected files or packages: `apps/website/`, `docs/`, `examples/`,
  `apps/cli/tests/cli.test.ts`
- Related specification: [`phase-7.md`](../specifications/phase-7.md)

## Approval

- **Approved by:** VAHU project owner
- **Approved on:** 2026-11-07
- **Review date:** None

## Notes

Implementation record: accurate Phase 7 website overview, quick start, source
documentation links, updated CLI/profile/examples docs, tests for website source
and Pages build output, and CLI validation for each committed example.
