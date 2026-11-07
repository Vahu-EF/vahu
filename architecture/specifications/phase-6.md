# Phase 6 specification — CLI Productization

- **Status:** In Progress — first read-only project and profile command increment implemented
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

## Validation

Command-level integration tests live in `apps/cli/tests/cli.test.ts` and exercise
human/JSON output, failure exit codes, read-only behavior, invalid catalogs, and
the built CLI profile command from another working directory.

```bash
pnpm exec vitest run apps/cli/tests/cli.test.ts
pnpm --filter vahu build
```

The full repository verification remains `pnpm check`.

## Acceptance state

| Criterion                                            | State   | Evidence                                                       |
| ---------------------------------------------------- | ------- | -------------------------------------------------------------- |
| Deterministic and documented CLI behavior            | Partial | Four commands documented and integration-tested                |
| Destructive operations require explicit confirmation | Partial | These commands are read-only; existing `init` has safeguards   |
| Dry-run accurately predicts file-changing operations | Not met | No new file-changing command in this increment                 |
| JSON output stable and versioned                     | Met     | `reportType` and `contractVersion: 1.0.0` tested               |
| Usable from a built CLI outside the source checkout  | Partial | Bundled profile catalog tested; package publication not tested |
| Cross-platform support matrix                        | Not met | Only current host CI coverage claimed                          |
| Broader Phase 6 command groups                       | Not met | Listed below                                                   |

## Remaining work

Not implemented in this increment: project configure; design inspect/propose;
profile add/remove; agents list/inspect/configure/sync; quality check; docs
validate; update; standalone `version` command; workflow execution; cross-platform
test matrix; package installation/publication verification. Existing commands
are not silently represented as new subcommands. These tasks remain for later
Phase 6 increments.

## Out of scope and limitations

This increment does not modify project configuration, execute quality-gate
commands, generate agent files, synchronize remote content, or publish npm
packages. A list from the built CLI is the framework snapshot bundled at build
time. The JSON contract is versioned output, not a separately published SDK/API.
