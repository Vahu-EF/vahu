# ADR-0001: Use a pnpm monorepo with explicit package boundaries

- **Status:** Accepted
- **Date:** 2026-11-06

## Context

VAHU needs one repository for framework content, the CLI, schemas, templates,
documentation, examples, and a future website. These areas change at different
rates and must not become a single coupled application.

The framework must remain usable without the CLI. The CLI must not become the
only way to understand or change a project.

## Decision

Use a pnpm workspace with these boundaries:

- `packages/schemas` owns configuration contracts.
- `packages/core` owns reusable executable validation and diagnostics.
- `apps/cli` owns terminal presentation and command wiring.
- `packages/framework` owns reusable knowledge and must not import the CLI.
- `apps/website` is an independent static application.
- `templates/` holds files intended for user projects.

Dependencies flow from schemas to core to the CLI. The website does not import
the CLI runtime. No circular package dependencies are allowed.

## Consequences

- The framework content can be read without installing Node.js or the CLI.
- Validation can be tested without a terminal process.
- The CLI stays thin enough to replace or wrap later.
- More package manifests and build steps are required, which is acceptable for
  a monorepo that expects multiple consumers.
- A second technology-profile tree is forbidden to avoid drift.
