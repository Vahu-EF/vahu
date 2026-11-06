# ADR-0003: Keep one versioned project configuration contract

- **Status:** Accepted
- **Date:** 2026-11-06

## Context

Projects need a stable configuration file that records identity, brand, design
system, technology, repository strategy, agents, and readiness. The file must be
readable by people, editable without the CLI, and safe to validate in CI.

The foundation document shows `https://example.invalid/vahu/project.schema.json`
as an example. That URL is not a real canonical location.

## Decision

Use `.vahu/project.json` with:

- `schemaVersion: "1.0.0"`;
- a Zod source of truth in `packages/schemas/src/project.ts`;
- a committed generated JSON Schema at `packages/schemas/project.schema.json`;
- strict objects that reject unknown fields;
- semantic readiness checks in `packages/core`;
- no public `$schema` URL until a stable published location is approved.

The local schema file is the contract in Phase 0. A future schema version needs
a migration path; silently accepting a different version is not allowed.

## Consequences

- Typos fail loudly.
- Editors can use the local JSON Schema when a project points to it explicitly.
- A schema version bump requires an explicit migration and release note.
- The `example.invalid` reference in `VAHU.md` remains a documented placeholder,
  not a silently invented production URL.
