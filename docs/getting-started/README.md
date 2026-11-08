# Getting started

## Requirements

- Node.js 22 or newer
- pnpm 10 or newer

## Install and verify

```bash
git clone https://github.com/Vahu-EF/vahu.git
cd vahu
pnpm install
pnpm check
```

`pnpm check` runs formatting, linting, type checking, unit tests, builds, and the
workspace-boundary validator.

## Run the CLI from source

```bash
pnpm dev -- --version
pnpm dev -- --help
pnpm dev -- doctor
pnpm dev -- validate --path examples/backend-project
pnpm dev -- project inspect --path examples/backend-project
pnpm dev -- profile list
```

## Build and run the CLI artifact

```bash
pnpm build
node apps/cli/dist/index.js --version
node apps/cli/dist/index.js validate --path examples/backend-project
```

The package name is `vahu`, but it is **not published to npm**. The built CLI bundles the three canonical technology profiles so `profile list` works from another working directory.

## Validate a project

A project needs a `.vahu/project.json` file. Start from
[the backend example](../../examples/backend-project/.vahu/project.json) or read
[the configuration guide](../concepts/project-configuration.md).

```bash
vahu validate --path /path/to/project
```

A blocking issue exits with status `1`. Warnings are reported but do not block a
configuration that is otherwise valid.

## Example projects

Five small example configurations are committed under `examples/`. The CLI test
suite validates every `examples/*/.vahu/project.json` on each test run. They are
configuration examples, not production applications.

## Current limits

`project inspect/status` and `profile list/validate` are read-only.
`project configure` previews identity-field updates and requires `--write` to
save them; broader stage configuration remains separate. Profile selection,
provider-specific adapters, agent synchronization, workflow execution, generated
documentation, and release publishing remain incomplete. See the [CLI reference](../cli/README.md) and the
[Phase 6 specification](../../architecture/specifications/phase-6.md).
