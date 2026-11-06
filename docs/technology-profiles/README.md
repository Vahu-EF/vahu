# Technology profiles

Canonical technology profiles live only at:

```text
packages/framework/technology-profiles/
```

There is no root-level `profiles/` directory. A second location would create two
sources of truth and make updates ambiguous.

## Planned profile categories

- backend;
- frontend;
- mobile;
- database;
- infrastructure;
- testing;
- deployment.

A profile should state its scope, assumptions, supported versions, required
tools, quality checks, and known limitations. Profiles are optional; a project
selects only what it needs.

## Status

The profile format and the initial profiles are **planned**. Phase 0 reserves the
location and the boundary only. Do not treat an example stack name as a supported
profile until its documentation and validation exist.
