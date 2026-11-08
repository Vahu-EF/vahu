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

### `vahu project inspect` and `vahu project status`

Read-only reports for project identity, technology choices, computed readiness,
and validation issues. The JSON output uses `reportType: "project-report"`,
`contractVersion: "1.0.0"`, and `view` (`inspect` or `status`). Missing or invalid
configuration emits structured issues and exits with status `1`.

```bash
vahu project inspect
vahu project status --path examples/backend-project --json
```

### `vahu profile list` and `vahu profile validate`

List or validate the bundled technology-profile catalog. `--path` chooses a
different profile directory. A built CLI bundles a snapshot of its profiles, so
listing works outside the source repository; it does not synchronize remote
profiles. JSON uses `reportType: "profile-list"` or
`"profile-validation"`, with `contractVersion: "1.0.0"`.

```bash
vahu profile list
vahu profile list --json
vahu profile validate --path packages/framework/technology-profiles
```

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

### Other onboarding stages

Each command requires an existing configuration and prints the section it wrote.

```bash
vahu brand --status not-applicable --notes "Internal service with no public brand."
vahu brand --status approved --logo assets/logo.svg --colors "#0b5fff"
vahu design --status pending-approval --source existing --path docs/design-system.md
vahu design approve
vahu technology --area backend --add "node, postgresql"
vahu technology --area backend --remove node
vahu repositories --strategy hybrid --notes "API and docs live apart." --location api=. --owner api=platform
vahu foundation
vahu readiness [--record]
```

- `brand`: `not-applicable` needs a reason; `approved` needs at least one asset.
- `design`: approval is refused without an existing or generated source and a
  path. Marking it not applicable clears both.
- `technology`: selects values per area. Profile definitions are available via `vahu profile list/validate`. `vahu profile add/remove <profile-id> --area <area>` previews the underlying technology change; pass `--write` to save it. This does not store a separate selected-profile ID or compose profile guidance.
- `repositories`: strategy, notes, `name=path-or-url` locations, and optional
  `--owner name=team` assignments. Each owner assignment must reference a
  configured location; duplicate or unknown names are rejected without writing.
- `foundation`: detects scripts, workflows, docs, and an environment example from
  files and writes nothing.
- `readiness`: prints blocking issues and recommendations; `--record` stores the
  computed status and check time. It exits `1` while something blocks.

### `vahu docs validate`

Checks local links in root Markdown and Markdown under `docs/`, `examples/`,
`templates/`, `architecture/`, `packages/framework/`, `apps/cli/`, and
`apps/website/`. It
ignores remote URLs, code samples, and missing optional directories, but fails
on unresolved local links or links that escape the repository root. `--path`
selects the repository root and `--json` prints a versioned report.

```bash
vahu docs validate
vahu docs validate --path ../another-repository --json
```

The same check runs as `pnpm validate:docs` and is part of `pnpm check`.

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

### `vahu profile add` and `vahu profile remove`

These commands add or remove the profile's technology in the matching project
area. They preview by default; `--write` is required to save. Use `--catalog` to
select a profile catalog and `--path` for the project directory. JSON uses the
`profile-selection-change` report type.

```bash
vahu profile add PROFILE-NODE-BACKEND --area backend --path .
vahu profile add PROFILE-NODE-BACKEND --area backend --path . --write
vahu profile remove PROFILE-NODE-BACKEND --area backend --path . --write
```

The command refuses unknown profiles, mismatched areas/project types, unmet
prerequisites, conflicts, unselected removals, and removal of prerequisites
needed by another selected profile. The project schema stores technologies, not
profile IDs, so the command does not record profile provenance or compose
profile guidance into generated content.

## Planned, not implemented

Agent configuration/sync, quality-check execution, framework update, and an
independent `version` subcommand are not implemented. The commands are
described in the roadmap, not implied by the Phase 6 milestone.

Project onboarding commands include brand, design, technology, repository
strategy, foundation inspection, and readiness, as recorded in
[`phase-2.md`](../../architecture/specifications/phase-2.md).

## Design boundary

The CLI formats output, asks questions, and handles exit codes. Configuration
loading and writing, schema validation, identity and approval rules, change
previews, and readiness rules live in `@vahu-ef/core` and can be used by other
tools without the CLI.
