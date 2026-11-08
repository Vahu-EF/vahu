# Phase 8 specification — Release, Distribution & Compatibility

- **Status:** In Progress — verified release candidates and the compatibility policy implemented
- **Owner approval:** Phase 8 first milestone approved by the VAHU project owner on 2026-11-07; four-package candidate set approved on 2026-11-08
- **Decision:** [ADR-0013](../decisions/ADR-0013-verified-release-candidates.md), accepted 2026-11-07
- **Canonical for:** Phase 8 release implementation status

## Goal

Make a release candidate inspectable and reproducible before anything is
published, and state the compatibility promises a published version would carry.

## Approved first milestone

The approved increment prepares and verifies npm candidates for the four
packages that have a consumer: `vahu`, `@vahu-ef/adapters`, `@vahu-ef/core`, and
`@vahu-ef/schemas`. The adapter package is included because `vahu agents sync`
uses its generic renderer. Nothing is published, no GitHub Release is created,
and no standalone executable is produced.

### Verified release candidate

`scripts/release/validate-artifacts.ts` packs the approved packages with
`pnpm pack` and inspects each resulting tarball rather than trusting the packing
tool's summary. CI and the release workflow run the same command, so the
candidates a reviewer downloads are the ones the checker accepted.

| Check              | Behavior                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Package set        | Exactly `vahu`, `@vahu-ef/adapters`, `@vahu-ef/core`, and `@vahu-ef/schemas`; others rejected                      |
| Private packages   | A tarball marked `private: true` is rejected                                                                       |
| Manifest identity  | Name, version, semver shape, and license field are required                                                        |
| Baseline files     | `package.json`, `README.md`, and `LICENSE` in every tarball                                                        |
| Required content   | CLI entry point plus bundled agent/profile catalogs, adapter/core type declarations, and the six JSON schemas      |
| Entry points       | Every `main`, `types`, `module`, `exports`, and `bin` target exists inside the archive                             |
| Workspace protocol | A packed `workspace:` range fails the candidate                                                                    |
| Internal versions  | `@vahu-ef/*` ranges must equal the version of the candidate they point at                                          |
| Excluded content   | Source, tests, source maps, build info, environment files, installed dependencies, changesets, and nested archives |
| Audit checksums    | SHA-256 per tarball and a `sha256sum`-compatible `SHA256SUMS` file                                                 |

`pnpm release:pack` builds nothing itself; it packs the current `dist/` output,
so it runs after `pnpm build` or `pnpm check`. `pnpm release:validate` re-checks
an existing `artifacts/` directory without repacking.

### Release workflow

`.github/workflows/release.yml` stays manual (`workflow_dispatch`), read-only
(`contents: read`), and artifact-only. It now packs through the validator,
verifies `SHA256SUMS` with `sha256sum -c`, and uploads the tarballs plus the
checksum file. No step publishes to npm or creates a GitHub Release, and no
token is read.

### Compatibility policy

[Versioning and compatibility](../../docs/contributing/versioning-and-compatibility.md)
records the SemVer rules for the CLI, the configuration schema, the JSON report
contract, framework content, profiles, and adapters, plus the Node.js support
policy and the deprecation and migration requirements.

## Not implemented

- npm publication, `npm publish`, provenance attestation, or trusted publishing.
- GitHub Releases, release notes generation, or tag creation.
- Standalone executables, a build matrix, signing, or platform smoke tests.
- Cross-platform candidate verification: the workflow packs on Ubuntu only.
- Backward-compatibility tests for older configuration versions beyond the
  existing `1.0.0` to `1.1.0` migration.

## Validation

```bash
pnpm build
pnpm release:pack
pnpm exec vitest run scripts/release/artifacts.test.ts
pnpm check
```

The artifact suite builds synthetic tarballs to prove each rule fails when it
should: a workspace dependency, a missing file, forbidden source content, a
missing or unexpected package, a private package, a drifted internal version,
and a missing entry point.

## Acceptance state

| Criterion                                          | State   | Evidence                                                                                                               |
| -------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| Releases are reproducible                          | Partial | Deterministic packing and fixed archive mtime; declaration output is not byte-stable, so rebuilds can change checksums |
| Published artifacts match tested source revisions  | Partial | The workflow packs the revision that passed `pnpm check`; nothing is published                                         |
| Package contents are inspected before publication  | Met     | Validator rejects bad contents and writes auditable checksums                                                          |
| Supported binaries run on their declared platforms | Not met | The CLI is Node-only; no standalone executables exist                                                                  |
| Release workflow cannot publish accidentally       | Met     | Manual dispatch, read-only token, and no publication step                                                              |
| npm package publication                            | Not met | Not requested or performed; needs explicit release approval and credentials                                            |
| Versioning and compatibility policy documented     | Met     | `docs/contributing/versioning-and-compatibility.md`                                                                    |

## Out of scope and limitations

This milestone does not make VAHU installable from a registry, does not claim
any published version, and does not verify installability on a clean machine.
A candidate passing the checks is necessary but not sufficient for publication:
the remaining approvals in
[release preparation](../../docs/contributing/release-preparation.md) still
apply.

Byte-identical rebuilds are not guaranteed. Repacking unchanged files produces
the same bytes, but rebuilding `@vahu-ef/schemas` can change `dist/index.d.ts`:
the declaration bundler emits one object member (`architecture`) in a varying
position. The archive contents are equivalent, yet the checksum differs. Treat a
checksum as identifying one specific candidate build, and verify a download
against its own `SHA256SUMS` rather than against a checksum from an earlier
build.
