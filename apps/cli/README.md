# vahu

The command-line interface for the VAHU engineering framework.

VAHU is a modular, agent-agnostic engineering framework for AI-assisted software
development. The CLI is one interface to the framework; the framework content
must remain usable without it.

## Status

Phase 6 CLI productization is in progress. This package is **not published to npm yet**.

Implemented commands include:

```bash
vahu --version
vahu --help
vahu doctor
vahu validate [--path <directory>] [--json]
vahu project inspect [--path <directory>] [--json]
vahu project status [--path <directory>] [--json]
vahu profile list [--path <catalog-directory>] [--json]
vahu profile validate [--path <catalog-directory>] [--json]
vahu init [options]
vahu identity [options]
vahu identity approve [options]
vahu migrate [options]
vahu brand [options]
vahu design [options]
vahu technology [options]
vahu repositories [--strategy <strategy>] [--notes <text>] [--location <name=path-or-url>]... [--owner <name=owner>]... [--path <directory>] [--json]
vahu foundation [options]
vahu readiness [options]
vahu docs validate [--path <repository-root>] [--json]
```

`project inspect/status` are read-only and report computed readiness and
validation issues. Profile commands inspect and validate the bundled profile
catalog; `--path` selects a different directory. A built CLI bundles the profile
snapshot and can list it outside the source repository. All these commands
support human-readable output by default and versioned JSON using `--json`.

Missing project configuration, invalid profile data, and unresolved local
Markdown links return a non-zero exit status. `docs validate` checks Markdown in
the repository documentation trees without modifying files. Repository owners
can be recorded with repeatable `--owner name=team` options; each name must match
a configured `--location` (or an existing location in the project). These
commands do not generate agent files or run quality gates.

## Install from source

```bash
git clone https://github.com/Vahu-EF/vahu.git
cd vahu
pnpm install
pnpm build
node apps/cli/dist/index.js --help
```

## Links

- [Repository](https://github.com/Vahu-EF/vahu)
- [Foundation document](https://github.com/Vahu-EF/vahu/blob/main/VAHU.md)
- [Security policy](https://github.com/Vahu-EF/vahu/blob/main/SECURITY.md)

## License

Apache License 2.0. See the repository `LICENSE`.
