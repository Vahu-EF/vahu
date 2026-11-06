# CLI

The package is named `vahu` and the binary is `vahu`. It is not published yet.

## Implemented in Phase 0

### `vahu --version`

Prints the CLI package version. The short form is `-v`.

### `vahu --help`

Lists commands, descriptions, and options.

### `vahu doctor`

Checks Node.js, pnpm, Git, the current Git repository, `.vahu/project.json`, and
the presence of `VAHU.md`. It prints `PASS`, `WARN`, or `FAIL` for each check.

Use `--json` for a machine-readable report. The command exits with status `1`
when a check fails.

### `vahu validate`

Validates `.vahu/project.json` in the current directory by default.

```bash
vahu validate
vahu validate --path examples/backend-project
vahu validate --json
```

It prints blocking errors and recommendations. It exits with status `1` when a
blocking issue exists. It does not modify the configuration.

## Planned, not implemented

`init`, `identity`, `design`, `profile`, `readiness`, `agents`, `docs`, `update`,
and `version` are roadmap commands from `VAHU.md`. They are deliberately absent
from this Phase 0 CLI.

## Design boundary

The CLI formats output and handles exit codes. Configuration loading, schema
validation, and readiness rules live in `@vahu-ef/core` and can be used by other
tools without the CLI.
