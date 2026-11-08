# ADR-0002: Use strict TypeScript and a small build/test toolchain

- **Status:** Accepted
- **Date:** 2026-11-06

## Context

VAHU needs a runtime CLI, shared validation packages, automated tests, and
reproducible CI. The toolchain must be small enough to audit and stable enough
for external contributors.

## Decision

Use:

| Area               | Choice                      |
| ------------------ | --------------------------- |
| Runtime            | Node.js 22+                 |
| Language           | TypeScript, strict settings |
| Workspace          | pnpm workspaces             |
| CLI parser         | Commander.js                |
| Runtime validation | Zod                         |
| Tests              | Vitest                      |
| Bundling           | tsup                        |
| Lint and format    | Biome                       |
| Releases           | Changesets, prepared only   |

These are implementation choices, not claims that every future VAHU project must
use the same stack. VAHU-authored projects may select different profiles.

## Consequences

- The CLI package can be bundled as ESM and eventually packed for npm.
- Tests can cover schemas and core logic without invoking the terminal.
- The build does not produce a standalone executable by itself. A separate
  packaging decision is required before GitHub Releases can ship binaries.
- Dependency versions are pinned in the lockfile and reviewed through Changesets
  and Dependabot.
- Biome provides formatting and linting, while TypeScript compilation remains a
  separate quality gate.
