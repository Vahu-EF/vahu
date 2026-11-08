# Phase 9 specification — Hardening & Community Readiness

- **Status:** In Progress — local write safety, security baseline, stability policy, and governance procedure documented
- **Owner approval:** This Phase 9 first milestone and spec approved by the VAHU project owner on 2026-11-07
- **Decision:** [ADR-0014](../decisions/ADR-0014-atomic-configuration-writes.md), accepted 2026-11-07
- **Canonical for:** Phase 9 hardening status

## Goal

Remove the defects a careful review finds in the code that already exists, and
state what stability means before any version is published.

## Approved first milestone

### Local write safety

`saveProjectConfig` wrote directly onto `.vahu/project.json`. Two tests written
before the change proved the defect: the file kept its inode across a save (in
place rewriting, so an interrupted run can truncate it), and a symlink at the
configuration path was followed, letting a committed link redirect the write to a
file outside the project.

The write now goes to a uniquely named temporary file in the same directory and
is renamed into place, with the temporary file removed when the write or rename
fails. Four tests cover creation, refusal, atomic replacement, symlink
replacement, temp cleanup on failure, and path containment.

### Security baseline

[The threat model](../../docs/security/threat-model.md) documents the assets,
trust boundaries, and ten threat/mitigation pairs for local file operations and
generated instructions, plus the residual risks that remain open. It is written
against the code: for example, it records that the CLI makes no network calls,
reads only the existence of `.env.example`, and executes only fixed `--version`
probes.

### Dependency remediation

`GHSA-g3hv-75wg-m249` (`minimatch` below `11.0.1`, denial of service through glob
parts amplification) reached the workspace transitively through ESLint and its
TypeScript plugin. The workspace initially lifted the range to `^11.0.1`; after
removing those dependencies, the current lockfile no longer includes `minimatch`
and the override was removed.

### Stability policy

[Stability and support policy](../../docs/contributing/stability-policy.md)
classifies every current surface as stable, experimental, or planned, defines the
supported platform and Node.js expectations, and states the evidence required
before a surface may be called stable.

## Not implemented

- Cross-platform integration results: a six-combination Ubuntu/macOS/Windows and Node 22/24 CI matrix is configured, but has not run from this workspace yet.
- Upgrade and migration tests beyond the existing `1.0.0` to `1.1.0` path.
- Large-repository performance tests.
- Idempotency checks for every command.
- Archive or template extraction (so no extraction hardening yet).
- Governance role assignments and service commitments: responsibilities and
  procedures are documented in `docs/contributing/governance.md`, but no named
  people/teams or response-time guarantees are assigned.
- A usability study with developers unfamiliar with VAHU.
- File locking for concurrent writers, and directory `fsync` durability.

## Validation

```bash
pnpm exec vitest run packages/core/src/config.test.ts
pnpm check
```

Two of the four configuration-write tests failed against the previous
implementation: the atomic-replacement check (same inode) and the symlink check
(the outside file was overwritten). Both pass after the change, so the tests
demonstrate the regression rather than merely accompanying it.

## Acceptance state

| Criterion                                                              | State   | Evidence                                                                                                    |
| ---------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| No known critical security issue remains unresolved                    | Partial | Write path hardened and one advisory remediated; audit endpoint unavailable on the configured mirror        |
| Core workflows pass supported platform tests                           | Partial | Ubuntu/Node 24 passed locally; six OS/Node matrix jobs are configured, pending hosted macOS/Windows results |
| Upgrade paths are tested                                               | Partial | `1.0.0` to `1.1.0` migration tested; no published version to upgrade from                                   |
| Public compatibility claims are backed by test evidence                | Partial | Configuration write, schema, and report contracts tested; core exports not itemized                         |
| Maintainers can triage, review, and release using documented processes | Partial | Governance procedures are documented; actual role holders and contact channel ownership are unassigned      |

## Out of scope and limitations

This milestone does not certify VAHU as secure or stable, does not complete the
Phase 9 areas, and does not close every residual risk in the threat model. No
phase is complete until its remaining areas have evidence.
