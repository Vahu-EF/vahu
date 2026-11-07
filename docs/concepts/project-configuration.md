# Project configuration

VAHU stores project configuration at:

```text
.vahu/project.json
```

The Zod schema in `packages/schemas/src/project.ts` is the source of truth. The
committed JSON Schema is generated from it.

## Creating the configuration

```bash
vahu init                 # guided
vahu identity approve --by "Project Owner"
vahu validate
```

`vahu init` captures Project Identity and writes a configuration whose
`identity.status` is `pending`. Only `vahu identity approve` records an approval,
with the approver's name and the date; `vahu validate` blocks until it happens.
Re-running `vahu init` prefills the answers from the existing file, prints a
preview of what changes, and returns the identity to `pending` because the earlier
approval no longer describes the project.

Sections the onboarding stage does not capture are written with honest starting
values rather than guesses: brand is `not-applicable`, the design system is
`not-started`, repositories default to `monorepo` with no invented locations, and
technology lists are empty. Long descriptions, lifecycle, repository locations,
and non-goals have no field in schema `1.0.0`; adding them needs a decision
record and a versioned schema change.

## Versioning

`schemaVersion` is currently `1.0.0`. A different version is rejected until a
migration is implemented. The configuration also records the framework version
in `vahu.version`.

Unknown fields are rejected. This is deliberate: a typo such as `desginSystem`
must fail loudly rather than be ignored.

## Minimal backend example

```json
{
  "schemaVersion": "1.0.0",
  "vahu": { "version": "0.1.0" },
  "project": {
    "name": "Example API",
    "slug": "example-api",
    "description": "A small backend service.",
    "purpose": "Provide an example API.",
    "targetUsers": ["developers"],
    "type": "backend-service",
    "languages": ["en"],
    "scope": "Phase 0 example",
    "constraints": []
  },
  "identity": { "status": "approved" },
  "brand": { "status": "not-applicable" },
  "designSystem": { "status": "not-applicable", "source": "none" },
  "repositories": { "strategy": "monorepo" },
  "technology": {
    "backend": ["node"],
    "frontend": [],
    "mobile": [],
    "database": ["postgresql"],
    "infrastructure": [],
    "testing": ["vitest"],
    "deployment": []
  },
  "agents": { "enabled": ["generic"], "configuration": {} },
  "readiness": { "status": "incomplete", "notes": [] }
}
```

## UI projects

A project is treated as a UI project when its type is a web, mobile, or desktop
application, or when it selects frontend or mobile technology. Such a project
must set:

```json
"designSystem": {
  "status": "approved",
  "source": "existing",
  "path": "docs/design-system.md"
}
```

A generated design system must pass through `pending-approval` before it becomes
`approved`. The configuration never grants approval on behalf of a user.

## Schema URL

No public schema URL is claimed in Phase 0. The historical `example.invalid`
value in `VAHU.md` remains a placeholder. The local
`packages/schemas/project.schema.json` file is the current machine-readable
contract. A stable published URL should be chosen with the website/Pages
decision.

## Secrets

The configuration must not contain credentials, API keys, tokens, passwords, or
private server addresses. Store runtime secrets in a local environment file or a
dedicated secret manager, never in `.vahu/project.json`.
