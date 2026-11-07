# CLI

The package is named `vahu` and the binary is `vahu`. It is not published yet.

## Implemented commands

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

### `vahu init`

Captures Project Identity and writes `.vahu/project.json`.

```bash
vahu init                                  # guided, in a terminal
vahu init --path ../service --yes \
  --name "Billing Service" --type backend-service \
  --description "Handles invoices." --purpose "Bill customers accurately." \
  --users "finance teams" --scope "First release"
```

Each missing answer is prompted for when stdin is a terminal; otherwise the
answer must come from a flag. `--name`, `--description`, `--purpose`,
`--users`, `--type`, and `--scope` are required, the slug is derived from the
name, and `--languages` defaults to `en`.

Optional identity fields: `--long-description`, `--lifecycle` (`planned`,
`active`, `maintenance`, `archived`), `--non-goals`, and repeatable
`--repository name=path-or-url`.

```bash
vahu init --name "Billing Service" --type backend-service --yes \
  --description "Handles invoices." --purpose "Bill customers accurately." \
  --users "finance teams" --scope "First release" \
  --long-description "Owns invoice creation, delivery, and reconciliation." \
  --lifecycle active --non-goals "Not a payment processor" \
  --repository "api=apps/api" --repository "docs=https://github.com/example/docs"
```

Before writing, the command prints a preview of the changed fields. A new file
needs `--yes` when no prompt can be shown; an existing file is only replaced
with `--force` or an explicit `y` answer. A file that does not parse or does not
match the schema is never replaced.

The written identity is `pending`: `init` never approves it.

### `vahu identity`

Prints the captured identity and its approval status, or the same information as
JSON with `--json`.

### `vahu identity approve`

Records an explicit Project Identity approval.

```bash
vahu identity approve --by "Project Owner"
vahu identity approve --path ../service --by "Project Owner" --json
```

An approval needs a non-empty approver name; the command refuses to record one
without it. Changing the identity later with `vahu init` returns it to
`pending`, so an old approval never covers a new identity.

### `vahu migrate`

Reads a configuration written with schema `1.0.0` and reports the change.

```bash
vahu migrate
vahu migrate --path ../service --write
```

It previews by default: the version change and the two empty collections the
migration adds. Only `--write` rewrites the file. A file that is already current
is reported and left alone, and a file that does not match its declared schema
is never rewritten. `vahu validate` recommends this command but does not block on
an older schema version.

## Planned, not implemented

`design`, `profile`, `readiness`, `agents`, `docs`, `update`, and `version` are
roadmap commands from `VAHU.md`. The remaining onboarding stages (brand, design
system, technology, repository strategy, engineering foundation, readiness) are
specified in
[`phase-2.md`](../../architecture/specifications/phase-2.md) but not implemented.

## Design boundary

The CLI formats output, asks questions, and handles exit codes. Configuration
loading and writing, schema validation, identity and approval rules, change
previews, and readiness rules live in `@vahu-ef/core` and can be used by other
tools without the CLI.
