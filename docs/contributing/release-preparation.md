# Release preparation

## Status

**Prepared, not active.** No npm package has been published and no GitHub Release
exists.

## Versioning

VAHU uses Semantic Versioning. The first planned release line is `0.x`; breaking
changes may happen before `1.0.0`, but they still require a deliberate version
change and migration notes.

The release unit records:

- CLI version (`vahu`);
- framework content version;
- project configuration schema version;
- technology-profile versions;
- adapter versions;
- template versions.

The schema version is `1.0.0` in Phase 0 and is independent of the CLI version.

## npm packages

The intended package layout is:

| Package            | Purpose                   | Status                           |
| ------------------ | ------------------------- | -------------------------------- |
| `vahu`             | CLI binary                | Metadata prepared; not published |
| `@vahu-ef/core`    | Reusable validation logic | Metadata prepared; not published |
| `@vahu-ef/schemas` | Configuration contracts   | Metadata prepared; not published |
| `@vahu-ef/cli`     | Potential scoped alias    | Not used; name check only        |

`@vahu-ef/cli` is not required if the unscoped `vahu` package remains the
primary installation path.

## GitHub Releases

The future release should include:

- the npm tarball;
- platform-specific executables;
- checksums;
- release notes;
- a changelog entry;
- installation and upgrade instructions.

The `.github/workflows/release.yml` workflow is manual and artifact-only. It does
not publish to npm or create a GitHub Release.

## Standalone executables

The CLI is ESM JavaScript for Node.js. A standalone executable requires a tested
packaging tool and platform-specific smoke tests. This is planned; compiling
TypeScript alone is not a standalone binary strategy.

## Required approvals

Before the first publication, the owners must confirm:

- the npm organization and package ownership;
- the release workflow secret names (never values in the repository);
- the legal copyright notice;
- supported Node.js and operating-system versions;
- executable packaging and signing policy.
