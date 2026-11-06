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
```

## Build and run the CLI artifact

```bash
pnpm build
node apps/cli/dist/index.js --version
node apps/cli/dist/index.js validate --path examples/backend-project
```

The package name is `vahu`, but it is **not published to npm** in Phase 0.

## Validate a project

A project needs a `.vahu/project.json` file. Start from
[the backend example](../../examples/backend-project/.vahu/project.json) or read
[the configuration guide](../concepts/project-configuration.md).

```bash
vahu validate --path /path/to/project
```

A blocking issue exits with status `1`. Warnings are reported but do not block a
configuration that is otherwise valid.

## What is not available

The onboarding wizard, project generation, technology-profile installation,
agent adapters, documentation generation, and release publishing are planned.
Do not treat the CLI roadmap in `VAHU.md` as a list of implemented commands.
