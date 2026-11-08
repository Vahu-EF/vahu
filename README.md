# VAHU

**Build Better Software, With Better Agents.**

VAHU is a reusable, agent-agnostic, stack-agnostic engineering framework for
AI-assisted software development. It provides engineering standards, workflows,
technology profiles, templates, documentation structures, quality gates, and
adapters for different AI coding agents.

VAHU is not a prompt collection and it is not tied to one AI provider. The
framework content must remain useful without the CLI.

> **Status:** Phase 1 is complete; Phases 2–9 are in progress. Phase-level
> evidence and unfinished items are tracked in the
> [roadmap register](architecture/specifications/unfinished-work.md). This repository is actively developed; there is no npm release or GitHub Release yet.

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

| Capability                     | Status      | What exists now                                                                                                                  |
| ------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Framework foundation           | Implemented | `VAHU.md`, monorepo boundaries, documentation skeleton, architectural decisions                                                  |
| Project configuration schema   | Implemented | Versioned Zod schema and JSON Schema; `1.1.0` reads `1.0.0` via migration                                                        |
| CLI foundation                 | Implemented | Onboarding, read-only project reports, profile list/validate/add/remove, and documentation validation                            |
| Validation and readiness rules | Implemented | Identity, design-system, brand, repository, technology, and readiness checks                                                     |
| Core engineering standards     | Implemented | 15 Phase 1 standards, all accepted                                                                                               |
| Framework content model        | In Progress | Draft metadata, discovery, and composition contract with a validator                                                             |
| Technology profiles            | In Progress | Validated profile schema, three profiles, and a composition gate                                                                 |
| Agent adapters                 | In Progress | Canonical agent schema and generic adapter; no provider adapter is claimed                                                       |
| Project onboarding             | In Progress | Identity, brand, design recording, technology, repository ownership, foundation, and readiness; design analysis/proposals remain |
| Engineering workflows          | In Progress | 14 lifecycle definitions, 13 gates, and a non-executing evidence evaluator                                                       |
| Full documentation engine      | Planned     | Not implemented                                                                                                                  |
| Website                        | In Progress | Updated static overview and quick start; Pages is not published                                                                  |
| Release verification           | In Progress | Verified npm candidates with checksums; nothing published                                                                        |

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
pnpm dev -- init --path ../my-project
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
vahu init [--path <directory>] [flags] [--yes] [--force]
vahu identity [--path <directory>] [--json]
vahu identity approve [--path <directory>] --by "Your Name"
vahu brand --status <status> [--logo <ref>] [--colors <list>] [--notes <text>]
vahu design [--status <status>] [--source <source>] [--path <path>]
vahu design approve
vahu technology --area <area> [--add <list>] [--remove <list>]
vahu repositories [--strategy <strategy>] [--notes <text>] [--location <name=path-or-url>]... [--owner <name=owner>]...
vahu foundation [--path <directory>]
vahu readiness [--record] [--path <directory>]
vahu migrate [--path <directory>] [--write]
vahu project inspect [--path <directory>] [--json]
vahu project status [--path <directory>] [--json]
vahu profile list [--path <catalog-directory>] [--json]
vahu profile validate [--path <catalog-directory>] [--json]
vahu profile add <profile-id> [--area <area>] [--path <directory>] [--write] [--json]
vahu profile remove <profile-id> [--area <area>] [--path <directory>] [--write] [--json]
vahu docs validate [--path <repository-root>] [--json]
```

`project inspect/status` report the project configuration and computed readiness
without writing. `profile list/validate` inspect the bundled technology-profile
snapshot; the built CLI bundles profiles so listing works outside the checkout.
Their JSON reports carry `contractVersion: "1.0.0"` and a `reportType`.

`doctor` checks the local environment and project configuration. `validate`
checks `.vahu/project.json` and the readiness rules. `init` captures Project
Identity and writes the configuration, and `identity approve` records the
explicit approval that `validate` requires. The onboarding commands record brand,
design-system, technology, repository, and readiness decisions, and `foundation`
inspects detected engineering facts without writing. `migrate` reads a `1.0.0`
configuration and rewrites it at the current schema version only when asked.
Profile listing, validation, and preview-first technology add/remove are
implemented. Add/remove changes the project's technology values and requires
`--write` to persist; the schema does not store profile IDs or compose their
guidance into generated content. `vahu docs validate` checks local Markdown
links and also runs as part of `pnpm check`. Agent configuration/sync commands
remain **not implemented**.
Workflow definitions and quality gates are validated by
`pnpm validate:workflows`, but there is no CLI workflow runner and the core
evaluator does not execute commands.

## Project configuration

A VAHU project stores its versioned configuration at:

```text
.vahu/project.json
```

The schema is defined in `packages/schemas/src/project.ts` and generated as
`packages/schemas/project.schema.json`. See
[the configuration guide](docs/concepts/project-configuration.md) and the
[backend-only example](examples/backend-project/.vahu/project.json).

Important onboarding rules implemented so far:

- Project Identity must be approved.
- `vahu init` writes a `pending` identity and never approves it; only
  `vahu identity approve` records an approval, with a name and date.
- An existing design system can be imported; a generated one is not final until
  approved.
- A UI project needs an approved design system.
- A backend-only project can mark brand assets as `not-applicable`.
- Unknown configuration fields are rejected to catch typos.
- The schema version is explicit and must be migrated deliberately: `1.0.0`
  files are read through an in-memory migration, and `vahu migrate --write`
  records the new version.

The `example.invalid` schema URL in the historical foundation document is a
placeholder. No public schema URL is claimed during Phase 0; the local schema
file is the current source of truth.

## Technology and agent support

VAHU does not prescribe a stack. Technology profiles describe one category at a time, so a project can combine
backend, frontend, mobile, database, and infrastructure choices without adopting
unrelated rules. The CLI can list and validate profiles and preview or write
the corresponding technology selection. The schema does not retain selected
profile IDs, and composition into project or agent content is not implemented.

Agent configuration is written once as a canonical JSON definition under
`packages/framework/agents/` and rendered by an adapter. The `generic` adapter
renders provider-neutral Markdown; the OpenAI Codex, Claude Code, and Gemini CLI
adapters are **not implemented or compatibility-tested**, and unsupported
capabilities will be reported rather than silently discarded.

## Quality and security

Phase 0 includes:

- strict TypeScript configuration;
- Biome formatting and lint checks;
- Vitest tests for schemas, validation logic, CLI behavior, and framework
  validators;
- workspace-boundary, standards-content, workflow, profile, and documentation
  validation scripts;
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

No package is published and no release exists. Verified candidates come from
`pnpm release:pack`; the process is documented in
[the release guide](docs/contributing/release-preparation.md) and the
compatibility promises in
[versioning and compatibility](docs/contributing/versioning-and-compatibility.md).

## License

VAHU is intended to be distributed under the [Apache License 2.0](LICENSE).
The organization has not asserted a separate legal copyright notice in this
repository; project owners should confirm the appropriate notice before a public
release.

## Project status

Phase 1 is complete. All 15 work packages are accepted and binding, listed in
the [core index](packages/framework/core/README.md): [P1-14: Engineering
decisions](packages/framework/core/engineering-decisions.md) and [P1-01:
Architecture principles](packages/framework/core/architecture-principles.md) on
2026-11-06, and the remaining 13 on 2026-11-07. P1-15 provides the
`pnpm validate:standards` check, which runs in `pnpm check` and CI.

Phase 2 (Project Identity & Onboarding) is in progress: repository-location
ownership is implemented, while design-system analysis/proposals remain. See [the
Phase 2 specification](architecture/specifications/phase-2.md). Phase 3 (Agent
Ecosystem & Adapters) and Phase 4 (Technology Profiles) have their canonical
contracts and initial implementations. Phase 5 (Engineering Workflows & Quality
Gates) is in progress; the lifecycle workflows and evaluator exist, but command
execution and independent evidence attestation do not. See [its specification](architecture/specifications/phase-5.md)
for scope and limitations. Phase 6 (CLI Productization) is in progress; its first read-only project and
profile commands are documented in [the Phase 6
specification](architecture/specifications/phase-6.md), including preview-first profile technology changes. Phase 7 (Documentation,
Website & Examples) has begun with a public overview, updated guides, and
validated example configurations; the [Phase 7
specification](architecture/specifications/phase-7.md) records what remains.
Phase 8 (Release, Distribution & Compatibility) has verified npm candidates,
checksums, and a compatibility policy; the [Phase 8
specification](architecture/specifications/phase-8.md) records what is not
implemented. Phase 9 (Hardening & Community Readiness) has begun with atomic,
symlink-safe configuration writes, a [threat
model](docs/security/threat-model.md), and a [stability
policy](docs/contributing/stability-policy.md); the [Phase 9
specification](architecture/specifications/phase-9.md) records what remains.

The phase plan for Phases 1–9 is in [the
roadmap](architecture/specifications/roadmap.md), with the current state table,
content-model scope, and [consolidated unfinished-work register](architecture/specifications/unfinished-work.md). Provider-specific agent adapters,
workflow execution, remaining Phase 6 CLI commands, publication, standalone
executables, design-system analysis/proposals, and the production website remain
future work.
