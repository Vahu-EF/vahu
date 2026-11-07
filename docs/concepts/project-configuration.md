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

It captures the long description, lifecycle, non-goals, and repository locations
as well as the required fields. Sections it does not capture are written with
honest starting values rather than guesses: brand is `not-applicable`, the design
system is `not-started`, repositories default to `monorepo` strategy with no
invented locations, and technology lists are empty.

## Versioning

`schemaVersion` is currently `1.1.0`. It added `project.longDescription`,
`project.lifecycle`, `project.nonGoals`, and `repositories.locations` to `1.0.0`
without renaming, removing, or re-typing a field
([ADR-0007](../../architecture/decisions/ADR-0007-project-identity-schema-1-1-0.md)).

The configuration also records the framework version in `vahu.version`.

A `1.0.0` file is still read: it is validated against the `1.0.0` schema, then
migrated in memory, and `vahu validate` adds a `SCHEMA_1_0_0_NOT_MIGRATED`
recommendation rather than an error. `vahu migrate --write` rewrites the file as
`1.1.0`, adding only `project.nonGoals: []` and `repositories.locations: []`. An
unsupported version is rejected with the supported list.

Unknown fields are rejected. This is deliberate: a typo such as `desginSystem`
must fail loudly rather than be ignored.

## Minimal backend example

```json
{
  "schemaVersion": "1.1.0",
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
    "constraints": [],
    "nonGoals": ["Not a general-purpose CRM"]
  },
  "identity": { "status": "approved" },
  "brand": { "status": "not-applicable" },
  "designSystem": { "status": "not-applicable", "source": "none" },
  "repositories": {
    "strategy": "monorepo",
    "locations": [{ "name": "api", "path": "apps/api", "role": "service" }]
  },
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
