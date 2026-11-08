# Release preparation

## Status

**Prepared and verified, not published.** No npm package has been published and no
GitHub Release exists. `pnpm release:pack` produces a checked candidate; nothing
in this repository uploads it to a registry.

## Verified release candidate

```bash
pnpm build          # candidates are packed from built dist/ output
pnpm release:pack   # pack and inspect the approved packages
```

The command writes tarballs and a `SHA256SUMS` file to `artifacts/`, which is
ignored by Git. `pnpm release:validate` re-checks an existing `artifacts/`
directory without repacking. Both commands exit non-zero when a check fails;
`--json` prints the machine-readable report and `--help` lists the options.

The candidate is rejected when any of the following is true:

- the package set is not exactly `vahu`, `@vahu-ef/adapters`, `@vahu-ef/core`, and `@vahu-ef/schemas`;
- an artifact is marked `private`, has no readable manifest, no version, no
  license field, or no `README.md`/`LICENSE`;
- expected content is missing: the CLI entry point, bundled agent/profile
  catalogs, adapter/core type declarations, or the JSON schemas;
- a `main`, `types`, `module`, `exports`, or `bin` target is absent from the
  archive;
- a dependency range still uses the `workspace:` protocol, or an `@vahu-ef/*`
  range does not match the candidate version it points at;
- the archive contains source, tests, source maps, build info, environment
  files, installed dependencies, changesets, or another archive.

Verify a downloaded candidate against its published checksums:

```bash
sha256sum -c SHA256SUMS
```

Passing these checks is necessary, not sufficient: publication still requires the
approvals below.

### Reproducibility limits

Packing the same `dist/` output twice produces identical bytes. A rebuild is not
guaranteed to: `@vahu-ef/schemas` declaration bundling emits one object member in
a varying order, so `dist/index.d.ts` and the tarball checksum can change with no
source change. Verify a download against the `SHA256SUMS` shipped with that same
build rather than against a checksum recorded elsewhere.

## Versioning

VAHU uses Semantic Versioning. The first planned release line is `0.x`; breaking
changes may happen before `1.0.0`, but they still require a deliberate version
change and migration notes. See
[versioning and compatibility](versioning-and-compatibility.md) for the
compatibility promises attached to each surface.

The release unit records:

- CLI version (`vahu`);
- framework content version;
- project configuration schema version;
- technology-profile versions;
- adapter versions;
- template versions.

The schema version is `1.1.0` and is independent of the CLI version.

## npm packages

| Package             | Purpose                   | Status                            |
| ------------------- | ------------------------- | --------------------------------- |
| `vahu`              | CLI binary                | Verified candidate; not published |
| `@vahu-ef/core`     | Reusable validation logic | Verified candidate; not published |
| `@vahu-ef/schemas`  | Configuration contracts   | Verified candidate; not published |
| `@vahu-ef/adapters` | Agent rendering boundary  | Verified candidate; not published |
| `@vahu-ef/website`  | Static site               | Private; never published          |
| `@vahu-ef/cli`      | Potential scoped alias    | Not used; name check only         |

`@vahu-ef/adapters` is included because the CLI uses its generic renderer for
preview-first agent synchronization. `@vahu-ef/website` remains a private
application and is never part of the candidate set.

## GitHub Releases

A release would contain:

- the verified npm tarballs and `SHA256SUMS`;
- platform-specific executables, once they exist and are tested;
- release notes and a changelog entry;
- installation and upgrade instructions.

`.github/workflows/release.yml` is manual and artifact-only. It runs `pnpm check`,
packs through the validator, verifies the checksum manifest, and uploads the
candidate. It has read-only repository permissions and does not publish to npm or
create a GitHub Release.

## Standalone executables

The CLI is ESM JavaScript for Node.js. A standalone executable requires a tested
packaging tool and per-platform smoke tests. This is not implemented; compiling
TypeScript is not a standalone binary strategy, and no executable is claimed.

## Required approvals

Before the first publication, the owners must confirm:

- the npm organization and package ownership;
- how provenance or trusted publishing is configured, and the release workflow
  secret names (never values in the repository);
- the legal copyright notice;
- supported Node.js and operating-system versions;
- executable packaging and signing policy;
- an explicit release approval naming the version and the tested commit.
