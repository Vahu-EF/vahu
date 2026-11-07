# VAHU — Post-Phase 0 Development Roadmap

**Project:** VAHU  
**CLI:** `vahu`  
**Organization:** https://github.com/Vahu-EF  
**Repository:** https://github.com/Vahu-EF/vahu  
**Tagline:** Build Better Software, With Better Agents.  
**Document status:** Proposed phase plan — Phase 0 and Phase 1 complete; Phase 2 in progress  
**Scope:** Phases 1–9. Phase 0 is recorded in [`phase-0.md`](phase-0.md) and the
foundation document [`VAHU.md`](../../VAHU.md).  
**Companion specifications:** [`phase-0.md`](phase-0.md), [`phase-1.md`](phase-1.md), [`phase-2.md`](phase-2.md), [`phase-3.md`](phase-3.md), [`phase-4.md`](phase-4.md)

---

## 1. Purpose

This document defines the recommended implementation sequence after Phase 0. It is intended to be used by coding agents as the roadmap for future work.

VAHU is a reusable, agent-agnostic, stack-agnostic engineering framework for AI-assisted software development. It must remain useful without the VAHU CLI, avoid vendor lock-in, and make engineering standards, project context, workflows, and quality expectations explicit and reusable.

This roadmap is a proposal. The user must approve each phase before implementation begins.

## 2. Non-negotiable engineering principles

1. **Framework first, CLI second.** Framework standards and assets must be consumable directly from the repository without installing the CLI.
2. **Agent agnostic.** Keep a canonical, provider-neutral representation of instructions, rules, skills, workflows, and tool requirements. Use adapters to render provider-specific files.
3. **Stack agnostic.** Technology profiles are optional, composable, and project-selected. Qeluni's stack is an example profile, not a default requirement.
4. **Human approval for consequential decisions.** Product direction, architecture, brand identity, design systems, data migrations, security-sensitive actions, and release/publishing decisions require explicit approval.
5. **One source of truth.** Avoid duplicated standards, schemas, profiles, templates, and generated configuration.
6. **Observable and verifiable.** Every automated operation should explain what it changed and how it was validated.
7. **Safe by default.** Never overwrite user-owned files, expose secrets, or silently make destructive changes.
8. **Incremental delivery.** Each phase must leave the repository buildable and tested.
9. **Document reality.** Never claim a feature, integration, test, or compatibility level that has not been verified.
10. **No premature platform.** Do not introduce a hosted service, marketplace, telemetry system, or remote synchronization unless separately approved.

## 3. Phase map

| Phase | Name                                       | Main outcome                                                                      |
| ----- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| 0     | Foundation & Architecture                  | Repository, workspace, baseline CLI, schemas, CI and project documentation        |
| 1     | Core Engineering & Canonical Content Model | The Phase 1 standards content plus a provider-neutral content contract            |
| 2     | Project Identity & Onboarding              | A safe, approval-based project onboarding flow                                    |
| 3     | Agent Ecosystem & Adapters                 | Canonical agent definitions and first verified provider adapters                  |
| 4     | Technology Profiles                        | Modular, composable stack profiles with validation                                |
| 5     | Engineering Workflows & Quality Gates      | Repeatable lifecycle workflows and measurable quality checks                      |
| 6     | CLI Productization                         | Reliable commands for initializing, inspecting, validating, and updating projects |
| 7     | Documentation, Website & Examples          | Public documentation, examples, and contributor experience                        |
| 8     | Release, Distribution & Compatibility      | Reproducible npm and standalone releases with compatibility policy                |
| 9     | Hardening & Community Readiness            | Security, accessibility, usability, governance, and stable adoption               |

Do not combine phases merely to finish faster. A phase may be split into smaller milestones if implementation scope or agent context limits require it.

## 3.1 Phase approvals

A phase starts only after the project owner approves it. This table is the
record; an agent may not add an approval row on the owner's behalf.

| Phase | Approval                                                       | Date       | Record                     |
| ----- | -------------------------------------------------------------- | ---------- | -------------------------- |
| 0     | Approved and complete                                          | 2026-11-06 | [`phase-0.md`](phase-0.md) |
| 1     | Approved and complete                                          | 2026-11-07 | [`phase-1.md`](phase-1.md) |     | 2   | Approved; stages implemented | 2026-11-07 | [`phase-2.md`](phase-2.md) |     | 3   | Approved; canonical model and generic adapter implemented | 2026-11-07 | [`phase-3.md`](phase-3.md) |
| 4     | Approved; schema, profiles, and composition checks implemented | 2026-11-07 | [`phase-4.md`](phase-4.md) |
| 5–9   | Not approved                                                   | —          | This document              |

## 3.2 Current implementation state

This roadmap was written before Phase 1 began. The repository moved first on the
standards content, which this document previously treated as only part of
Phase 1. To avoid two competing definitions of Phase 1, the canonical Phase 1
specification [`phase-1.md`](phase-1.md) owns the standards content and this
roadmap owns the content model that wraps it.

| Area                                             | State                                                        | Where                                                           |
| ------------------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------- |
| Phase 0 foundation                               | Complete                                                     | [`phase-0.md`](phase-0.md)                                      |
| Phase 1 standards content                        | 15 work packages accepted (2026-11-06 and 2026-11-07)        | [`phase-1.md`](phase-1.md)                                      |
| Phase 1 content metadata, composition, discovery | Draft contract implemented                                   | [`CONTENT_MODEL.md`](../../packages/framework/CONTENT_MODEL.md) |
| Phase 1 structural validation                    | Standard pages, content model, decision index                | `pnpm validate:standards`                                       |     | Phase 2 | Approved 2026-11-07; stages 1–8 implemented (3 and 6 partial) | [`phase-2.md`](phase-2.md) |
| Phase 3                                          | Approved 2026-11-07; generic adapter implemented             | [`phase-3.md`](phase-3.md)                                      |
| Phase 4                                          | Approved 2026-11-07; three profiles and the gate implemented | [`phase-4.md`](phase-4.md)                                      |
| Phases 5–9                                       | Not started; not approved                                    | This document                                                   |

Read this table before assigning any phase. Do not re-implement content that
already exists, and do not assume the metadata model is settled.

---

# Phase 1 — Core Engineering & Canonical Content Model

## Objective

Make VAHU's framework content genuinely usable: the engineering standards that
already exist, plus a documented contract for how standards, rules, workflows,
profiles, templates, and agent-neutral instructions are represented, discovered,
versioned, and validated.

The framework must be usable directly from the repository without the CLI.

## Status

Phase 1 is complete: both halves are implemented and all 15 standards are
accepted.

| Part | Scope                                                         | State                                                           |
| ---- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| 1a   | Core engineering standards (P1-01 – P1-15)                    | Accepted 2026-11-06 (P1-14, P1-01) and 2026-11-07 (the rest)    |
| 1b   | Content metadata, composition, discovery (sections 1–3 below) | Implemented as a draft guide (`CONTENT_MODEL.md`)               |
| 1c   | Structural validation (section 4 below)                       | Implemented for pages, content metadata, and the decision index |

Phase 1 is complete only when both halves meet the acceptance criteria below.
Part 1a is tracked in [`phase-1.md`](phase-1.md); do not duplicate its status
table here.

## Scope

### 1. Canonical framework structure

Review the Phase 0 repository and establish a documented content contract for:

- Core engineering principles.
- Project lifecycle standards.
- Requirements and planning standards.
- Architecture standards.
- Implementation standards.
- Testing and quality standards.
- Security and privacy standards.
- Documentation standards.
- Review and release standards.
- Maintenance and change-management standards.

Do not create large amounts of generic prose. Prefer actionable standards with clear intent, applicability, required evidence, and validation guidance.

### 2. Content metadata

Define a consistent metadata format for framework documents and reusable assets. Where appropriate, support:

- Stable identifier.
- Title and concise description.
- Content type.
- Version.
- Status (draft, experimental, stable, deprecated).
- Applicable project types.
- Applicable lifecycle stages.
- Dependencies or prerequisites.
- Tags.
- Source and ownership.
- Compatibility constraints.

Use the Phase 0 schema package where possible. Do not introduce a second metadata system.

#### Reconciliation with the existing standard pages

The Phase 1 standards already carry metadata under P1-14. The content model must
extend that format, not replace it. Map the two status vocabularies explicitly
instead of introducing a competing set of values:

| Content-model status | Standard-page status                      |
| -------------------- | ----------------------------------------- |
| `draft`              | `Draft`                                   |
| `experimental`       | `Draft`, with an explicit experiment note |
| `stable`             | `Accepted`                                |
| `deprecated`         | `Superseded` or `Retired`                 |

Fields that exist on standard pages (`Standard ID`, `Owner`, `Approver`,
`Approval`, `Version`, `Applies to`) are the source for the equivalent content
fields. Add content type, lifecycle stage, tags, and dependency fields around
them; do not re-key the existing values.

### 3. Content composition

Define how projects select and combine:

- Mandatory core standards.
- Optional practices.
- Technology profiles.
- Agent adapters.
- Project-specific overrides.

Specify deterministic precedence rules. Project-specific configuration may specialize framework defaults but must not silently invalidate mandatory security or safety requirements.

### 4. Validation

Implement validation for framework content:

- Required metadata is present.
- Identifiers are unique.
- Internal references resolve.
- Referenced files exist.
- Deprecated content is clearly marked.
- Dependency relationships are valid.
- No circular dependencies exist where dependencies are supported.

Current state: `pnpm validate:standards` implements every item above for
`packages/framework/` and the ADR index — required metadata, unique identifiers,
resolved references, content type, lifecycle stage, tags, dependency validity,
dependency cycles, and deprecation notes. Remaining gaps: templates, docs, and
examples outside `packages/framework/` are not discovered yet, and no tool
applies composition to a real project. Extend the same validator rather than
adding a second one.

### 5. Initial framework content

Create a small but useful baseline set of standards. Prioritize quality over quantity.

At minimum, cover:

- Engineering principles.
- Requirements and scope.
- Architecture decision records.
- Coding and implementation practices.
- Testing strategy.
- Code review.
- Documentation maintenance.
- Security and secrets handling.
- Change management.

Current state: this baseline exists under `packages/framework/core/`, indexed by
[`packages/framework/core/README.md`](../../packages/framework/core/README.md),
and all 15 pages are accepted. Requirements and scope, and change management,
are only partly covered; treat those as gaps to close rather than new work to
start from scratch.

## Deliverables

- Canonical framework content contract.
- Metadata schema and validation.
- Initial core standards.
- Content discovery and composition specification.
- Tests and examples.
- Documentation explaining how to consume framework content without the CLI.

## Acceptance criteria

- Framework content is independent of CLI code.
- Every published content item follows the canonical metadata contract.
- Validation catches malformed metadata and broken references.
- Content identifiers are stable and unique.
- Composition and precedence rules are documented and tested.
- A developer can understand and use the core framework by browsing the repository alone.

## Out of scope

- Full onboarding wizard.
- Complete agent integrations.
- Large technology profile catalog.
- Hosted services or marketplace.

---

# Phase 2 — Project Identity & Onboarding

## Status

Approved by the VAHU project owner on 2026-11-07. Stage 1 (Project Identity) is
implemented; Stages 2–8 have not started. The scope below is the approved scope,
and [`phase-2.md`](phase-2.md) records how each stage is implemented and what
remains. Nothing outside that scope is in scope without a new approval.

## Objective

Build a guided, safe, resumable onboarding experience that gathers essential project context and produces a valid `.vahu/project.json` configuration.

## Onboarding stages

Implement the onboarding journey in the following order, while allowing supported projects to mark irrelevant stages as not applicable with an explicit reason.

### Stage 1: Project Identity

Capture:

- Project name.
- Short and long description.
- Project purpose and intended users.
- Product category.
- Project status and lifecycle.
- Repository locations and strategy.
- Primary language for project documentation.
- Important constraints and non-goals.

Project Identity is mandatory.

### Stage 2: Brand Identity and Assets

Capture, where relevant:

- Brand name and pronunciation.
- Logo and brand asset references.
- Brand colors and typography.
- Tone and public-facing identity guidance.

Branding must not block backend-only, infrastructure-only, or otherwise unbranded projects. Support `pending`, `not_applicable`, and approved states with a reason where appropriate.

Do not invent brand meanings, logos, colors, or claims.

### Stage 3: Design System

Support two paths:

**Import and analyze an existing design system**

- Inspect supplied design tokens, component libraries, styles, and design documentation.
- Identify gaps, inconsistencies, and platform mappings.
- Preserve existing design decisions unless the user approves changes.

**Propose a new design system**

- Gather product and audience context.
- Propose tokens, typography, spacing, color, components, and interaction principles.
- Present a reviewable proposal.

A generated or proposed design system is not approved automatically.

### Stage 4: Design Approval

Capture explicit approval status and revision information.

If UI development is planned, an approved and usable design system is required before UI implementation workflows can be marked ready.

Backend-only projects must not be blocked by visual design requirements.

### Stage 5: Technology Selection

Allow selection of one or more technologies and profiles by project area, such as:

- Backend.
- Frontend/web.
- Mobile.
- Database.
- Infrastructure.
- Testing.
- Observability.

Do not assume that a project uses Qeluni's technology stack.

### Stage 6: Repository Strategy

Support:

- Monorepo.
- Multirepo.
- Single repository.
- Hybrid arrangements.

Capture repository paths, ownership, boundaries, and relationships without assuming all projects are in one workspace.

### Stage 7: Engineering Foundation

Inspect or capture:

- Existing conventions.
- Build and test commands.
- Lint and formatting tools.
- CI/CD status.
- Environment and secrets conventions.
- Deployment model.
- Documentation locations.
- Existing quality gates.

Distinguish detected facts from user-provided facts and assumptions.

### Stage 8: Project Readiness

Produce a readiness report with:

- Ready.
- Needs attention.
- Blocked.
- Not applicable.

Every status must include evidence or a clear reason. Do not mark a project ready merely because onboarding was completed.

## Functional requirements

- Save progress and resume onboarding.
- Validate inputs at each stage.
- Support explicit approval checkpoints.
- Show a review summary before writing configuration.
- Never overwrite an existing configuration without preview and explicit approval.
- Back up or preserve existing user-owned files when applying changes.
- Support non-interactive configuration later, but prioritize a usable guided experience first.
- Keep the onboarding domain logic separate from CLI presentation.

## Deliverables

- Onboarding state model.
- Updated versioned project schema.
- Guided onboarding workflow.
- Import/analyze design system flow.
- Design system proposal and approval flow.
- Readiness evaluator.
- Tests for incomplete, invalid, backend-only, UI, and multirepository projects.

## Acceptance criteria

- A user can create a valid project configuration through onboarding.
- Onboarding can be resumed without losing approved decisions.
- Design proposals cannot become approved without explicit user action.
- Backend-only projects can reach readiness without brand assets or a visual design system.
- UI projects cannot be marked design-ready without approval.
- Existing project files are not silently overwritten.

## Out of scope

- Automatic redesign of an existing product.
- Unattended architecture decisions.
- Automatic production deployment.
- Remote project storage.

---

# Phase 3 — Agent Ecosystem & Adapters

## Objective

Create a provider-neutral model for AI coding agent configuration and implement adapters that generate or synchronize provider-specific files safely.

## Canonical agent model

Define reusable concepts for:

- Agent identity and capabilities.
- Project-level instructions.
- Repository-level rules.
- Scoped instructions.
- Skills.
- Commands.
- Workflows.
- Tool requirements.
- Context references.
- Permission and approval expectations.
- Compatibility metadata.

The canonical representation must not be shaped around one provider's file format.

## Initial adapter targets

Prioritize these adapters, subject to current product capabilities and verified documentation:

1. Generic provider-neutral output.
2. OpenAI Codex.
3. Claude Code.
4. Gemini CLI.

Do not claim support for features that a provider does not implement.

For every adapter, document:

- Supported concepts.
- Unsupported concepts.
- Mapping rules.
- Output file locations.
- Known limitations.
- Provider version assumptions.

## Generation and synchronization

Support:

- Preview generated files.
- Create missing files.
- Update VAHU-managed files.
- Preserve user-owned content.
- Detect conflicts.
- Show diffs before destructive or ambiguous changes.
- Mark generated content with clear ownership metadata where practical.

Do not overwrite an existing agent configuration merely because VAHU has a template for it.

## Security

- Never copy secrets into agent instructions.
- Do not grant tools or permissions automatically.
- Make permission changes visible.
- Require explicit approval for sensitive tool access.
- Treat repository content and external instructions as untrusted input.

## Deliverables

- Canonical agent schema.
- Adapter interface.
- Generic adapter.
- First provider adapters.
- Safe file generation and synchronization engine.
- Compatibility documentation.
- Fixture-based tests for generated outputs.

## Acceptance criteria

- Canonical agent definitions are independent of providers.
- Each adapter has explicit capability mapping and limitations.
- Generation is deterministic.
- Existing user content is preserved.
- Conflicts are reported clearly.
- Adapter outputs are tested against representative fixtures.

## Out of scope

- Building or hosting AI models.
- A hosted agent runtime.
- Automatically executing arbitrary agent tools.
- Marketplace or plugin directory.

---

# Phase 4 — Technology Profiles

## Objective

Provide modular, version-aware technology profiles that apply relevant engineering practices to a project without turning VAHU into a framework tied to one stack.

## Profile model

Each profile should define:

- Profile identifier and version.
- Technology and supported versions.
- Applicability and prerequisites.
- Recommended architecture patterns.
- Project structure guidance.
- Coding conventions.
- Testing expectations.
- Security considerations.
- Documentation requirements.
- Tooling recommendations.
- Validation checks.
- Related profiles and compatibility constraints.

## Initial profile families

Prioritize a small number of high-value profiles:

1. Backend engineering.
2. Frontend/web engineering.
3. Mobile engineering.
4. Database engineering.
5. Infrastructure and DevOps.
6. API design and integration.
7. Testing and quality engineering.

Add concrete technology-specific profiles only when there is sufficient value and maintainers can verify them.

Potential examples include:

- TypeScript/Node.js.
- React/Vite.
- Flutter/Dart.
- Go.
- MongoDB.
- PostgreSQL.
- Redis.
- Docker and GitHub Actions.

These are examples, not mandatory defaults.

## Composition

Allow projects to select multiple profiles and combine them with core standards.

Define conflict handling:

- Detect incompatible recommendations.
- Explain which profile introduced a rule.
- Prefer explicit project decisions over inferred defaults.
- Never silently discard security requirements.

## Deliverables

- Profile schema and metadata.
- Profile selection and compatibility evaluator.
- Initial generic profiles.
- A limited set of concrete technology profiles.
- Tests for composition and conflict detection.
- Profile authoring guide.

## Acceptance criteria

- Profiles are independently reusable.
- Profiles declare supported versions and limitations.
- A project can select multiple compatible profiles.
- Conflicts are surfaced with explanations.
- No profile is assumed unless selected or explicitly configured.

---

# Phase 5 — Engineering Workflows & Quality Gates

## Objective

Turn VAHU's engineering principles into repeatable lifecycle workflows with clear inputs, outputs, approvals, and quality gates.

## Workflow lifecycle

Implement reusable workflows for:

1. Project discovery and requirements.
2. Scope definition and acceptance criteria.
3. Technical research.
4. Architecture design and ADRs.
5. Implementation planning.
6. Task decomposition.
7. Implementation.
8. Unit and integration testing.
9. Code review.
10. Security review.
11. Documentation updates.
12. Release preparation.
13. Deployment readiness.
14. Maintenance and incident follow-up.

## Workflow contract

Each workflow must define:

- Purpose.
- Trigger and prerequisites.
- Required context.
- Inputs.
- Steps.
- Expected outputs.
- Human approval checkpoints.
- Quality gates.
- Failure and recovery behavior.
- Related standards and profiles.

Workflows must be understandable by humans and usable by different agents.

## Quality gates

Create configurable gates for:

- Formatting.
- Linting.
- Type checking.
- Unit tests.
- Integration tests.
- Build validation.
- Dependency health.
- Secret scanning.
- Security checks.
- Documentation consistency.
- Accessibility and performance where relevant.

Do not require tools that are irrelevant to the selected project stack.

## Human approval

Require explicit approval for:

- Product scope changes.
- Architecture decisions with significant consequences.
- Database migrations that may lose or transform data.
- Security-sensitive permission changes.
- Brand and design system approval.
- Production deployments.
- Public releases and package publication.

## Deliverables

- Workflow schema.
- Initial lifecycle workflows.
- Quality gate definitions.
- Gate execution and reporting contracts.
- Approval checkpoint model.
- Tests for success, failure, skipped, and blocked states.

## Acceptance criteria

- Every workflow has explicit inputs and outputs.
- Workflows can be adapted to multiple agents.
- Quality gates are profile-aware.
- Failed gates cannot be reported as passed.
- Approval requirements are visible and enforceable by the workflow tooling.

---

# Phase 6 — CLI Productization

## Objective

Turn the Phase 0 CLI into a dependable user-facing interface for framework discovery, project onboarding, validation, agent configuration, and maintenance.

## Command groups

Evolve commands incrementally. The following is the target direction, not a requirement to implement all commands in one release.

### Project

- `vahu init`
- `vahu project inspect`
- `vahu project status`
- `vahu project configure`

### Identity and design

- `vahu identity`
- `vahu design inspect`
- `vahu design propose`
- `vahu design approve`

### Profiles

- `vahu profile list`
- `vahu profile add`
- `vahu profile remove`
- `vahu profile validate`

### Agents

- `vahu agents list`
- `vahu agents inspect`
- `vahu agents configure`
- `vahu agents sync`

### Quality and readiness

- `vahu doctor`
- `vahu validate`
- `vahu readiness`
- `vahu quality check`

### Documentation and maintenance

- `vahu docs validate`
- `vahu update`
- `vahu version`

## CLI UX requirements

- Consistent command naming and help.
- Useful error messages and exit codes.
- Human-readable output by default.
- Machine-readable JSON output for automation where appropriate.
- `--dry-run` for file-changing operations.
- Preview and diff before overwriting files.
- Clear distinction between warning, error, blocked, and not applicable.
- Respect user configuration and project boundaries.
- No telemetry by default.

## Compatibility

- Support documented Node.js LTS versions.
- Test on supported operating systems.
- Keep CLI commands thin; business logic belongs in reusable packages.
- Provide stable public APIs only when deliberately versioned.

## Deliverables

- Command architecture.
- Implemented command groups prioritized by user value.
- CLI integration tests.
- Cross-platform tests.
- Help and usage documentation.
- Upgrade and migration behavior.

## Acceptance criteria

- CLI behavior is deterministic and documented.
- Destructive operations require explicit confirmation.
- Dry-run accurately predicts changes.
- JSON output is stable enough for automation and versioned where needed.
- CLI can be installed and used independently of the source repository.

---

# Phase 7 — Documentation, Website & Examples

## Objective

Make VAHU understandable, discoverable, and adoptable by developers who have never seen the internal project discussions.

## Documentation information architecture

Build documentation for:

- What VAHU is and is not.
- Core concepts.
- Installation.
- Quick start.
- Project onboarding.
- Framework standards.
- Agent integrations.
- Technology profiles.
- Workflows and quality gates.
- CLI reference.
- Configuration reference.
- Troubleshooting.
- Contributing and governance.
- Security and compatibility.

## Website

Build the GitHub Pages website as a separate application under `apps/website/`.

The website should include:

- Clear value proposition.
- How VAHU works.
- Core capabilities.
- Supported agent integrations with honest status labels.
- Technology profile model.
- Quick-start path.
- Documentation links.
- GitHub repository and contribution links.
- Roadmap and project status.

Do not invent customer logos, testimonials, adoption metrics, or compatibility claims.

## Examples

Maintain tested examples for:

- Minimal project.
- Backend project.
- Web project.
- Mobile project.
- Multi-repository project.
- Existing design system.
- Backend-only project without branding.
- Project with multiple agent adapters.

Examples must be small, realistic, and validated in CI.

## Accessibility and responsive design

- Keyboard accessible navigation.
- Semantic structure.
- Appropriate contrast.
- Responsive layouts.
- Clear focus indicators.
- Reduced-motion support where animation is used.

## Deliverables

- Documentation site.
- Website.
- Quick-start guide.
- Tested example projects.
- Contributor guide.
- Documentation validation in CI.

## Acceptance criteria

- A new user can understand VAHU's purpose and start a sample project without private guidance.
- Documentation matches actual behavior.
- Examples pass automated validation.
- Website is responsive and accessible.
- GitHub Pages deployment is reproducible.

---

# Phase 8 — Release, Distribution & Compatibility

## Objective

Establish a trustworthy release process for npm packages and standalone GitHub Release binaries.

## Package strategy

Finalize package names and boundaries based on actual usage.

Potential package layout:

- CLI package.
- Core runtime package.
- Schema package.
- Optional framework content package, if distribution through npm provides clear value.

Do not publish packages that have no meaningful public API or consumer.

## npm release

Implement:

- Package metadata.
- Public export maps.
- Type declarations.
- Build artifacts.
- README and license inclusion.
- Provenance or trusted publishing where supported and configured.
- Versioning and changelog process.
- Release validation.
- Publication only after explicit release approval.

Never place long-lived npm tokens in repository files or workflow logs.

## Standalone releases

Build and test binaries for explicitly supported operating systems and architectures.

For each release:

- Generate checksums.
- Attach clear platform labels.
- Include release notes.
- Verify downloaded artifacts.
- Document installation and upgrade steps.

## Versioning and compatibility

Use Semantic Versioning for public packages and CLI.

Define:

- Stable and experimental APIs.
- Deprecation policy.
- Configuration schema compatibility.
- Framework content compatibility.
- Adapter compatibility.
- Node.js support policy.
- Migration guidance.

## Release security

- Protect release workflows.
- Use least-privilege GitHub Actions permissions.
- Pin third-party actions appropriately.
- Avoid exposing secrets.
- Produce auditable release artifacts.
- Require explicit authorization for public publication.

## Deliverables

- Release workflows.
- npm package publishing configuration.
- Standalone build matrix.
- Checksums and release notes.
- Versioning and compatibility policy.
- Upgrade and migration documentation.

## Acceptance criteria

- Releases are reproducible.
- Published artifacts match tested source revisions.
- Package contents are inspected before publication.
- Supported binaries run on their declared platforms.
- Release workflow cannot publish accidentally from an unapproved branch or event.

---

# Phase 9 — Hardening & Community Readiness

## Objective

Improve reliability, security, usability, governance, and contributor experience before declaring VAHU stable.

## Areas

### Security

- Threat model for local file operations and generated instructions.
- Dependency and supply-chain review.
- Secret handling review.
- Safe archive and template extraction.
- Path traversal protection.
- Permission and approval review.
- Security disclosure process.

### Reliability

- Cross-platform integration tests.
- Upgrade and migration tests.
- Large repository performance tests.
- Recovery from interrupted operations.
- Idempotency checks.
- Backward-compatibility tests.

### Usability

- Test onboarding with developers unfamiliar with VAHU.
- Review error messages and recovery guidance.
- Validate dry-run and diff experiences.
- Reduce unnecessary configuration.
- Ensure non-interactive automation is predictable.

### Governance

- Contribution policy.
- Maintainer responsibilities.
- Decision-making and ADR process.
- Issue triage.
- Release ownership.
- Security response expectations.

### Stability policy

Define what “stable” means for:

- CLI.
- Configuration schema.
- Core framework content.
- Agent adapters.
- Technology profiles.
- Public package APIs.

## Deliverables

- Security review and threat model.
- Reliability and compatibility report.
- Usability findings and fixes.
- Governance documentation.
- Stability and support policy.
- Release readiness assessment.

## Acceptance criteria

- No known critical security issue remains unresolved.
- Core workflows pass supported platform tests.
- Upgrade paths are tested.
- Public compatibility claims are backed by test evidence.
- Maintainers can triage, review, and release contributions using documented processes.

---

# 4. Cross-Phase Definition of Done

A phase is complete only when all applicable conditions are met:

1. Scope and non-goals are documented.
2. Architecture changes are recorded as ADRs when consequential.
3. Implementation is complete for the approved scope.
4. Tests cover normal, failure, and edge cases.
5. Lint, formatting, type checks, tests, and builds pass.
6. Documentation reflects actual behavior.
7. Security and privacy implications are reviewed.
8. No secrets or unrelated project files are included.
9. Existing user-owned files are preserved.
10. A completion report lists implemented, skipped, failed, and blocked work.
11. The user has reviewed and approved the phase before the next phase starts.

A green CI run alone does not mean a phase is accepted.

# 5. Rules for Coding Agents

Every agent receiving a phase task must:

1. Read `VAHU.md`, this roadmap, relevant ADRs, and repository instructions before changing files.
2. Inspect the current repository state; do not assume the roadmap is fully implemented.
3. Identify the exact approved phase and its acceptance criteria.
4. Produce a short implementation plan before making substantial changes.
5. Reuse existing schemas, interfaces, and utilities where appropriate.
6. Avoid duplicating sources of truth.
7. Preserve user changes and unrelated work.
8. Never modify Qeluni or another external project unless explicitly asked.
9. Never publish packages, create releases, or make irreversible remote changes without explicit authorization.
10. Run the relevant tests and report real results.
11. Update documentation and examples alongside implementation.
12. Stop at the end of the assigned phase.

If the repository state conflicts with this roadmap, report the conflict and recommend a resolution instead of blindly following outdated instructions.

# 6. Recommended Execution Strategy

Execute one phase at a time.

Recommended sequence:

1. ~~Complete and review Phase 0.~~ Done; see [`phase-0.md`](phase-0.md).
2. ~~Approve Phase 1.~~ Done for the standards content; P1-14 and P1-01 are
   accepted.
3. ~~Record owner acceptance for the Phase 1 drafts.~~ Done 2026-11-07; see
   [`phase-1.md`](phase-1.md) for the completion report.
4. ~~Approve Phase 2.~~ Done 2026-11-07; implementation may begin.
5. Implement and review Phase 2, then request approval for Phase 3. Adjust
   priorities only with explicit user approval.

Some work can be developed in parallel after its contracts are stable. For example, documentation examples and adapter fixtures may be prepared in parallel. However, do not parallelize work that depends on unresolved schemas, architecture, or approval decisions.

# 7. Phase Execution Prompt Template

Use the following template when assigning an individual phase to a coding agent:

---

**Task:** Implement VAHU Phase [NUMBER] — [PHASE NAME].

**Required reading:**

- `VAHU.md`
- `architecture/specifications/roadmap.md` (this document)
- `architecture/specifications/phase-0.md` and `phase-1.md`
- Relevant architecture decision records.
- Repository-specific agent instructions.

**Instructions:**

1. Inspect the current repository and identify what is already implemented.
2. Compare the current state against the assigned phase scope.
3. Present a concise implementation plan.
4. Implement only the approved phase.
5. Follow the phase deliverables and acceptance criteria.
6. Add or update tests.
7. Update documentation and examples.
8. Run all relevant quality checks.
9. Review the final diff for secrets, destructive changes, duplicated content, and unrelated modifications.
10. Provide a detailed completion report.

**Restrictions:**

- Do not start a later phase.
- Do not publish packages or releases.
- Do not make irreversible remote changes without explicit approval.
- Do not claim unverified functionality.
- Preserve existing user changes.

**Stop condition:** Stop after the assigned phase is implemented, tested, documented, and reported. Wait for explicit approval before continuing.

---

# 8. Immediate Next Steps

Phases 0 and 1 are complete and Phase 2 is approved but not started. The next
steps are:

1. ~~Approve the Phase 1 standards.~~ Done: P1-14 and P1-01 on 2026-11-06, the
   other 13 on 2026-11-07.
2. ~~Authorize Phase 2.~~ Approved by the project owner on 2026-11-07.
3. Assign Phase 2 and stop at its boundary. Its scope is the Phase 2 section
   above; a `phase-2.md` specification is written when the phase is assigned.
4. Schedule the per-standard checks that remain planned; none is claimed as
   implemented.

**Do not start Phase 2 until Phase 1 is accepted.**

Earlier revisions of this document told agents not to start Phase 1 during
Phase 0. That instruction is satisfied and no longer applies.

---

**End of document.**
