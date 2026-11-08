# Phase 6 specification — CLI Productization

- **Status:** In Progress — project reports/configuration, agent discovery, profile technology changes, and docs-link validation implemented; broader command groups remain
- **Owner approval:** Phase 6 and this first increment approved by the VAHU project owner on 2026-11-07
- **Decision:** [ADR-0011](../decisions/ADR-0011-cli-read-only-reports.md), accepted 2026-11-07
- **Canonical for:** Phase 6 CLI implementation status

## Goal

Evolve the existing CLI incrementally into a dependable interface for project
inspection, framework discovery, onboarding, validation, and maintenance. The
roadmap lists a target direction, not a requirement that all commands ship at
once.

## Approved first increment

The project owner approved these read-only commands and the versioned report
contract in ADR-0011:

| Command                 | Behavior                                                           |
| ----------------------- | ------------------------------------------------------------------ |
| `vahu project inspect`  | Project identity, technologies, readiness, and validation issues   |
| `vahu project status`   | Computed readiness summary and issues                              |
| `vahu profile list`     | List the bundled profile catalog; `--path` selects another catalog |
| `vahu profile validate` | Validate schemas, references, and the selected catalog             |

Human-readable output is the default. JSON uses command-specific `reportType`
discriminators and `contractVersion: "1.0.0"`. Missing project configuration
or an invalid profile catalog produces a JSON error report (when requested) and
non-zero exit status. These commands do not write project files.

The CLI build copies the canonical technology-profile JSON files into the
package output. The packaged CLI can therefore list its profile snapshot outside
the source checkout. It does not fetch or sync profiles remotely.

The `profile add/remove` commands preview technology selection changes and only
write when passed `--write`. They validate profile applicability, prerequisites,
and conflicts. The project schema stores technology values rather than profile
IDs; add/remove does not record profile provenance or compose guidance.

`project configure` previews before/after changes to Project Identity fields and
writes only with `--write`. A real identity change resets approval to pending and
readiness to incomplete; a no-op preserves both. Optional long description and
lifecycle can be cleared explicitly. This command does not configure other
project sections; stage-specific commands remain responsible for those.

`agents list/inspect` reads and validates canonical definitions, defaulting to
the catalog bundled with the built CLI. The `sync` command previews generic `AGENTS.md` output and writes only with
`--write`. It rejects unmarked targets and symlinks; marked targets are replaced
as a whole, without merging or preserving manual edits inside the generated file.
List/inspect JSON reports use `agent-list` and `agent-inspection` discriminators
at contract version `1.0.0`; sync uses `agent-sync`. The CLI build
bundles the validated canonical agent JSON snapshot alongside technology profiles.

## Validation

Command-level integration tests live in `apps/cli/tests/cli.test.ts` and exercise
human/JSON output, failure exit codes, read-only behavior, invalid catalogs,
preview/write/idempotency and unsafe targets, and built CLI catalog commands from
another working directory.

```bash
pnpm exec vitest run apps/cli/tests/cli.test.ts
pnpm --filter vahu build
```

The full repository verification remains `pnpm check`.

## Acceptance state

| Criterion                                            | State   | Evidence                                                                                                  |
| ---------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| Deterministic and documented CLI behavior            | Partial | Reports, identity configuration, agent discovery, version, docs validation, and profile add/remove tested |
| Destructive operations require explicit confirmation | Partial | Project/profile mutations preview by default and require `--write`; other file changes retain safeguards  |
| Dry-run accurately predicts file-changing operations | Partial | Project configure shows before/after values; profile add/remove previews selection; other writes remain   |
| JSON output stable and versioned                     | Met     | `reportType` and `contractVersion: 1.0.0` tested                                                          |
| Usable from a built CLI outside the source checkout  | Partial | Bundled profile catalog tested; package publication not tested                                            |
| Cross-platform CI matrix configured                  | Met     | Ubuntu/macOS/Windows and Node 22/24 configured; hosted runs pending                                       |
| `vahu docs validate` and CI matrix configuration     | Met     | Versioned docs report is tested; six OS/Node jobs configured, hosted runs pending                         |

## Remaining work

Not implemented: full project/stage configure beyond identity; design
inspect/propose; agent provider-specific configure/adapters and merge-aware sync;
quality check; framework update; workflow execution;
package installation/publication verification. Profile add/remove are implemented
as preview-first technology changes; profile provenance and content composition
remain outside this increment. Hosted macOS and Windows matrix runs are pending.
Existing commands are not silently represented as new subcommands; these tasks
remain for later Phase 6 increments.

## Out of scope and limitations

Project configure edits Project Identity fields only; the other project stages
have dedicated commands. Agent list/inspect read the bundled canonical snapshot; generic sync replaces a
marked target as a whole and does not merge user edits. Profile add/remove
modifies project technology configuration only. This increment does not execute
quality-gate commands, synchronize remote content, or publish npm packages. Catalog commands use
framework snapshots bundled at build time. The JSON contract is versioned output,
not a separately published SDK/API.
