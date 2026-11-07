# ADR-0011: Version read-only CLI report contracts

- **Status:** Accepted
- **Date:** 2026-11-07
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Supersedes:** None
- **Superseded by:** None

## Context

Phase 6 introduces CLI commands intended for people and automation. The
project-inspection and profile commands need predictable JSON responses, useful
human output, and clear exit status without changing project files. An
unversioned response shape would make scripts fragile as the CLI evolves.

The project owner approved the bounded Phase 6 increment: read-only
`project inspect/status` and `profile list/validate`, with profile commands
reading the bundled canonical catalog unless `--path` is supplied.

## Decision

- `project inspect` and `project status` share the `project-report` JSON
  contract, with `contractVersion: "1.0.0"` and an explicit `view` discriminator.
- `profile list` emits `profile-list`; `profile validate` emits
  `profile-validation`. Each uses `contractVersion: "1.0.0"`.
- Successful reports have `ok: true`; missing projects or invalid catalogs
  return `ok: false`, actionable issue objects, and a non-zero process exit.
- Default output is human-readable. `--json` emits one JSON document on stdout;
  diagnostic text is not mixed into a JSON response.
- These commands are read-only. Project configuration changes remain with the
  existing onboarding commands; profile selection, generation, and sync are not
  performed by these commands.
- The CLI build copies the canonical profile JSON into `dist/technology-profiles`
  so a built CLI can list and validate its bundled catalog outside the source
  repository. `--path` selects a different profile catalog for validation.

The report shapes are defined by command tests and documented in the CLI
reference. A future incompatible shape change requires a deliberate contract
version change and migration or coexistence policy.

## Consequences

Positive:

- Scripts can branch on a discriminator and contract version rather than parse
  presentation text.
- Invalid and missing inputs remain visible in JSON and produce meaningful exit
  status.
- Inspect/status do not mutate project files; the bundled profiles make the
  packaged list command independent of the user's current working directory.

Negative and open:

- `profile list` bundles a snapshot of the framework profiles at build time; it
  does not fetch or synchronize remote content.
- Only four read-only commands are included in this milestone. The Phase 6
  roadmap's broader command groups and cross-platform matrix remain incomplete.
- No stable public library API is declared by these CLI output contracts.

## Alternatives considered

- **Parse the human-readable output in automation.** Rejected: presentation copy
  is not a stable machine interface.
- **Use one untyped JSON shape for every command.** Rejected: a `reportType` and
  version make the shape explicit and extensible without inference.
- **Have `profile list` read the current working directory by default.**
  Rejected: behavior would depend on the caller's location rather than the
  bundled framework catalog.
- **Let these commands edit configuration as a convenience.** Rejected for this
  increment: safe profile selection needs its own diff, validation, and explicit
  write contract.

## Links

- Related ADRs: [ADR-0003](ADR-0003-configuration-contract.md),
  [ADR-0009](ADR-0009-technology-profile-contract.md),
  [ADR-0010](ADR-0010-agent-neutral-workflows-and-gate-evidence.md)
- Affected files or packages: `apps/cli/src/commands/project-info.ts`,
  `apps/cli/src/commands/profile.ts`, `apps/cli/tests/cli.test.ts`
- Related specification: [`phase-6.md`](../specifications/phase-6.md)

## Approval

- **Approved by:** VAHU project owner
- **Approved on:** 2026-11-07
- **Review date:** None

## Notes

Implementation record: read-only `project inspect/status`, `profile
list/validate`, versioned JSON reports, framework profiles bundled at CLI build
time, command-level tests, and user-facing CLI documentation.
