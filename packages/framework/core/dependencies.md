# P1-05 — Dependencies

- **Standard ID:** P1-05
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.0
- **Applies to:** Applications, libraries, tools, build scripts, and CI configuration.
- **Content type:** standard
- **Lifecycle stages:** planning, implementation, review
- **Project types:** all
- **Depends on:** P1-14
- **Tags:** dependencies, supply-chain, maintenance
- **Related:** [P1-13: Security baseline](security-baseline.md), [P1-01: Architecture principles](architecture-principles.md), [P1-14: Engineering decisions](engineering-decisions.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Keep the dependency graph small, justified, and current. Every dependency is
code the project did not write, cannot fully test, and must keep patched;
adding one should be a decision rather than a reflex.

## Scope

This standard covers selecting, scoping, updating, and removing third-party
dependencies, including transitive risk and tooling dependencies.

## Non-goals

This standard does not:

- forbid third-party code;
- mandate a package manager, registry, or vendoring strategy;
- define vulnerability response steps. P1-13 owns the security baseline;
- define license policy beyond the review requirement;
- require a specific update cadence.

## Rules

### P1-05-R1 — Justify every dependency

- **Level:** MUST
- **Rule:** A new dependency states the problem it solves, why the platform or an
  existing dependency cannot solve it, and what happens if it is later removed.
  Record that reasoning in the pull request or an ADR when the decision is
  long-lived.
- **Rationale:** Unjustified dependencies accumulate and become impossible to
  remove because nobody remembers why they exist.
- **Verification:** Review the change. The justification exists where a future
  maintainer will look.

### P1-05-R2 — Prefer the platform first

- **Level:** SHOULD
- **Rule:** Prefer the standard library, the language runtime, or an existing
  dependency over a new package for small or well-specified problems.
- **Rationale:** Each dependency adds supply-chain, license, and upgrade cost
  that is rarely worth it for a few lines of well-understood code.
- **Verification:** The change explains why the platform option was rejected.

### P1-05-R3 — Commit the lockfile and resolve reproducibly

- **Level:** MUST
- **Rule:** Commit the lockfile. Install exact versions from it in CI and in
  release builds, and fail the build when the lockfile and manifest disagree.
- **Rationale:** Unpinned installs make builds non-reproducible and let an
  unrelated upstream release break a build or a release.
- **Verification:** CI installs with a frozen lockfile; a manifest change without
  a lockfile change fails the build.

### P1-05-R4 — Declare dependencies at the narrowest scope

- **Level:** SHOULD
- **Rule:** Declare a dependency only in the package that uses it, at the scope
  it is used: runtime dependencies for runtime code, development dependencies
  for tooling, peer dependencies for shared contracts.
- **Rationale:** Broad declarations leak capability and version constraints into
  packages that never use them, and they hide the real dependency graph.
- **Verification:** Review manifests against imports in each package.

### P1-05-R5 — Keep one dependency per job

- **Level:** SHOULD
- **Rule:** Do not keep two dependencies that perform the same role in one area,
  such as two date libraries or two HTTP clients. Consolidate or record the
  reason for the exception.
- **Rationale:** Duplicate roles double the upgrade and security surface and
  split conventions inside one codebase.
- **Verification:** Review the dependency list for overlapping roles.

### P1-05-R6 — Review updates deliberately

- **Level:** MUST
- **Rule:** Review dependency updates for behavior change, license change, and
  breaking changes before taking them. Do not merge an automated update because
  it is green; a passing build does not prove compatible behavior.
- **Rationale:** Automated updates move code the project does not own into the
  production path without a human reading the change.
- **Verification:** The update change names the version range, the reason, and
  any migration done. Security updates are prioritized.

### P1-05-R7 — Remove dependencies in the same change that stops using them

- **Level:** MUST
- **Rule:** When the last use of a dependency is removed, remove the declaration
  and update the lockfile in the same change. Do not leave an unused dependency
  "for later".
- **Rationale:** Unused dependencies keep consuming review, audit, and upgrade
  attention while providing nothing.
- **Verification:** Search for imports before declaring the removal complete; run
  the install and the repository gate.

### P1-05-R8 — Respect licenses and attribution

- **Level:** MUST
- **Rule:** Check the license of every new dependency against the project's
  distribution model. Preserve required notices, and do not copy third-party
  code into the repository without its license and attribution.
- **Rationale:** A license mistake is a legal problem that cannot be fixed by a
  later code review.
- **Verification:** Review the license of each added dependency; confirm notices
  where the license requires them.

## Examples

### Compliant: a justified dependency

A project adds a schema validation library with an ADR that names the contract
it protects, the alternatives considered, and the upgrade owner. The lockfile is
committed and CI installs frozen.

### Compliant: platform over package

A contributor needs to join file paths and uses the runtime module instead of
adding a package that wraps it.

### Non-compliant: duplicate roles

Two HTTP clients are in use because two features were built at different times.
Neither is documented, and both appear in the security audit.

### Non-compliant: unreviewed automated upgrade

An automated pull request bumps a major version and updates nothing else. It is
merged because CI is green, and a behavior change reaches production unnoticed.

## Exceptions

Exceptions follow P1-14-R12. A temporary duplicate dependency during a migration
may remain while the migration is in progress. The exception names the rule,
both dependencies, the owner, and the completion date.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- unused dependency detection;
- lockfile and manifest consistency in CI;
- license allowlist checks;
- duplicate-role reporting for reviewed dependency lists.

## Related decisions

- [P1-13: Security baseline](security-baseline.md)
- [P1-01: Architecture principles](architecture-principles.md)
- [P1-14: Engineering decisions](engineering-decisions.md)

## Change history

| Version | Date       | Change                         |
| ------- | ---------- | ------------------------------ |
| 0.1.0   | 2026-11-07 | Initial draft.                 |
| 0.1.0   | 2026-11-07 | Accepted by the project owner. |

## Approval record

| Version | Status   | Approver           | Date       |
| ------- | -------- | ------------------ | ---------- |
| 0.1.0   | Accepted | VAHU project owner | 2026-11-07 |
