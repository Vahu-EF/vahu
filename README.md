# VAHU

**Build Better Software, With Better Agents.**

VAHU is a reusable, agent-agnostic, stack-agnostic engineering framework for
AI-assisted software development. It provides engineering standards, workflows,
technology profiles, templates, documentation structures, quality gates, and
adapters for different AI coding agents.

VAHU is not a prompt collection and it is not tied to one AI provider. The
framework content must remain useful without the CLI.

> **Status:** Phase 0 — Foundation and Architecture. This repository is being
> actively developed. There is no npm release or GitHub Release yet.

## Why VAHU exists

AI coding agents are useful, but a project still needs a clear engineering
foundation: architecture, ownership, conventions, verification, security, and
documentation that people can inspect. VAHU aims to make that foundation easy to
start, repeatable across projects, and independent of any one agent or stack.

## Vision and philosophy

VAHU should help a team move from “an agent wrote this” to “this project has a
reviewable engineering system.”

The core principles are:

- **Agent agnostic** — use an internal representation and explicit adapters.
- **Stack agnostic** — select only the technology profiles a project needs.
- **Engineering first** — standards and evidence come before prompts.
- **Documentation first** — documentation is part of implementation.
- **Human approval** — product, architecture, brand, and design decisions need
  explicit approval.
- **Modular** — adopt capabilities incrementally.
- **Reproducible** — make setup and conventions repeatable.
- **Transparent** — generated files stay readable and inspectable.
- **Maintainable** — avoid duplication, unnecessary abstraction, and vendor
  lock-in.

## Core capabilities

| Capability                     | Status      | What exists now                                                                 |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------- |
| Framework foundation           | Implemented | `VAHU.md`, monorepo boundaries, documentation skeleton, architectural decisions |
| Project configuration schema   | Implemented | Versioned Zod schema and JSON Schema for `.vahu/project.json`                   |
| CLI foundation                 | Implemented | `vahu --version`, `--help`, `doctor`, and `validate`                            |
| Validation and readiness rules | Implemented | Identity, design-system, brand, repository, technology, and readiness checks    |
| Core engineering standards     | In Progress | P1-14 engineering-decisions draft; remaining standards are planned              |
| Technology profiles            | Planned     | One canonical location reserved under `packages/framework/technology-profiles/` |
| Agent adapters                 | Planned     | Adapter folders and contracts only; no adapter is claimed                       |
| Project onboarding wizard      | Planned     | Not implemented                                                                 |
| Full documentation engine      | Planned     | Not implemented                                                                 |
| Website                        | In Progress | A small static site source exists; it is not published                          |

## Architecture overview

```text
                     +-------------------------+
                     |      apps/website       |
                     |  public site (separate) |
                     +------------+------------+
                                  |
                                  | reads public docs only
                                  v
+------------------+      +------------------+      +------------------+
| packages/schemas | ---> |  packages/core   | ---> |     apps/cli     |
| config contracts |      | validation logic |      | thin terminal UI |
+------------------+      +------------------+      +------------------+
          ^                                                   ^
          |                                                   |
          +---------------- framework content ----------------+
                    packages/framework, templates, docs
```

The dependency direction is one-way. `schemas` has no dependency on `core`;
`core` has no dependency on the CLI; the website does not import the CLI runtime.

The canonical technology-profile location is
`packages/framework/technology-profiles/`. There is no root `profiles/` tree, to
avoid a second source of truth.

## Repository structure

```text
vahu/
├── .github/                 workflows, issue templates, review templates
├── apps/
│   ├── cli/                 the `vahu` command
│   └── website/             independent static site source
├── packages/
│   ├── core/                reusable validation and diagnostics
│   ├── schemas/             versioned project configuration contracts
│   ├── framework/           reusable engineering content
│   └── adapters/            agent adapter boundary (planned implementations)
├── templates/               project, repository, docs, agents, CI/CD, design
├── architecture/            decisions, diagrams, specifications
├── docs/                    human-facing documentation
├── examples/                onboarding examples
├── scripts/                 workspace validation and release preparation
└── tests/                   cross-package test areas
```

## Getting started

### Requirements

- Node.js 22 or newer (Node.js 24 is used in CI)
- pnpm 10 or newer (pnpm 12.3.4 is used in this workspace)

### From source

```bash
git clone https://github.com/Vahu-EF/vahu.git
cd vahu
pnpm install
pnpm check
```

Run the CLI from source:

```bash
pnpm dev -- --help
pnpm dev -- doctor
pnpm dev -- validate --path examples/minimal-project
```

Build the workspace:

```bash
pnpm build
node apps/cli/dist/index.js --version
```

### Current CLI commands

```bash
vahu --version
vahu --help
vahu doctor
vahu validate [--path <directory>] [--json]
```

`doctor` checks the local environment and project configuration. `validate`
checks `.vahu/project.json` and the Phase 0 readiness rules. Commands from the
long-term CLI roadmap, such as `init`, `identity`, `design`, and `agents`, are
**not implemented** yet.

## Project configuration

A VAHU project stores its versioned configuration at:

```text
.vahu/project.json
```

The schema is defined in `packages/schemas/src/project.ts` and generated as
`packages/schemas/project.schema.json`. See
[the configuration guide](docs/concepts/project-configuration.md) and the
[backend-only example](examples/backend-project/.vahu/project.json).

Important onboarding rules implemented in Phase 0:

- Project Identity must be approved.
- An existing design system can be imported; a generated one is not final until
  approved.
- A UI project needs an approved design system.
- A backend-only project can mark brand assets as `not-applicable`.
- Unknown configuration fields are rejected to catch typos.
- The schema version is explicit and must be migrated deliberately.

The `example.invalid` schema URL in the historical foundation document is a
placeholder. No public schema URL is claimed during Phase 0; the local schema
file is the current source of truth.

## Technology and agent support

VAHU does not prescribe a stack. Technology profiles will describe one category
at a time, so a project can combine backend, frontend, mobile, database, and
infrastructure choices without adopting unrelated rules.

The initial agent targets under evaluation are OpenAI Codex, Claude Code, Gemini
CLI, and a generic instruction-based adapter. **No adapter is implemented or
compatibility-tested in Phase 0.** Unsupported capabilities will be reported,
not silently discarded.

## Quality and security

Phase 0 includes:

- strict TypeScript configuration;
- Prettier formatting checks;
- ESLint checks;
- Vitest tests for schemas, validation logic, and CLI behavior;
- a workspace-boundary validation script;
- GitHub Actions for CI, lint, security analysis, and dependency review;
- a security policy with private vulnerability reporting guidance.

No secrets belong in `.vahu/project.json`, documentation, examples, or commit
history. See [SECURITY.md](SECURITY.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. The
project uses small, reviewable changes and conventional commit messages.

The planned branch workflow is:

- `main` — releasable foundation;
- short-lived feature branches for changes;
- pull requests with passing checks.

Phase 0 does not publish packages or create releases. Release preparation is
documented in [the release guide](docs/contributing/release-preparation.md).

## License

VAHU is intended to be distributed under the [Apache License 2.0](LICENSE).
The organization has not asserted a separate legal copyright notice in this
repository; project owners should confirm the appropriate notice before a public
release.

## Project status

Phase 1 is in progress. The first slice, [P1-14: Engineering
decisions](packages/framework/core/engineering-decisions.md), is implemented as
a draft and awaits owner acceptance. P1-01 and the remaining Phase 1 packages
have not started. Technology profiles, full onboarding, agent adapters, release
artifacts, and the production website remain future work.
