# vahu

The command-line interface for the VAHU engineering framework.

VAHU is a modular, agent-agnostic engineering framework for AI-assisted software
development. The CLI is one interface to the framework; the framework content
must remain usable without it.

## Status

Early Phase 0 preparation. This package is **not published to npm yet**.

Implemented commands:

```bash
vahu --version
vahu --help
vahu doctor
vahu validate [--path <directory>] [--json]
```

`doctor` checks the local environment and project configuration. `validate`
checks `.vahu/project.json` against the versioned schema and Phase 0 readiness
rules.

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
