# Concepts

## Framework and CLI are separate

The framework is reusable engineering content: standards, profiles, templates,
workflows, and documentation conventions. The CLI is one way to validate and
operate on that content. A project must remain understandable without the CLI.

## Canonical locations

- Configuration contract: `packages/schemas/`
- Reusable validation logic: `packages/core/`
- Framework content: `packages/framework/`
- Technology profiles: `packages/framework/technology-profiles/`
- Templates: `templates/`
- Public documentation: `docs/`
- Architecture decisions: `architecture/decisions/`

There is no root `profiles/` directory. Keeping one location prevents two copies
of a profile from drifting apart.

## Project identity and readiness

Project Identity is the minimum onboarding information: name, slug, purpose,
users, type, languages, scope, and constraints. It must be approved before a
project enters its normal development workflow.

For a UI project, the design system must be approved and usable. A backend-only
project can mark brand assets and the design system as `not-applicable` through
an explicit configuration decision. A pending brand is allowed but produces a
warning.

Read [project configuration](project-configuration.md) for the schema and
[the readiness rules](readiness.md) for the exact behavior implemented today.
