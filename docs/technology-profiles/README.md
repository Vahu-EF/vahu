# Technology profiles

Canonical technology profiles live only at:

```text
packages/framework/technology-profiles/
```

There is no root-level `profiles/` directory. A second location would create two
sources of truth and make updates ambiguous.

## Profile categories

The schema supports backend, frontend, mobile, database, infrastructure, API,
and testing categories. The current catalog contains backend (`node`), database
(`postgresql`), and testing (`vitest`) profiles. Additional categories are not
yet represented by concrete profiles.

A profile should state its scope, assumptions, supported versions, required
tools, quality checks, and known limitations. Profiles are optional; a project
selects only what it needs.

## Status

The versioned profile format and three initial profiles are implemented. Run
`pnpm validate:profiles` to validate the canonical catalog, or use
`vahu profile list` and `vahu profile validate` from the CLI. Profile selection
and mutation through the CLI are not implemented; project technology values are
not silently interpreted as applied profile rules. See the
[Phase 4 specification](../../architecture/specifications/phase-4.md) for exact
coverage and limitations.
