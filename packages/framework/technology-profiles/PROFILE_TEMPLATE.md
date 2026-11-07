# Profile template

Profiles are JSON files validated by
[`profile.schema.json`](../../schemas/profile.schema.json). Copy the shape
below, replace every placeholder, and run `pnpm validate:profiles`.

```json
{
  "schemaVersion": "1.0.0",
  "id": "PROFILE-TECHNOLOGY",
  "name": "Human-readable name",
  "description": "What the profile covers.",
  "version": "0.1.0",
  "category": "backend | frontend | mobile | database | infrastructure | api | testing",
  "technology": "the value recorded in project.technology",
  "supportedVersions": [">=1"],
  "projectTypes": ["all"],
  "prerequisites": [],
  "related": [],
  "architecture": ["..."],
  "structure": ["..."],
  "conventions": ["..."],
  "testing": ["..."],
  "security": ["..."],
  "documentation": ["..."],
  "tooling": ["..."],
  "checks": ["..."],
  "compatibility": {
    "conflictsWith": [],
    "notes": "Known limitations."
  }
}
```

## Field notes

- `id` is stable and upper-case: `PROFILE-POSTGRESQL`.
- `technology` must match the value a project records in `technology`.
- `prerequisites` and `conflictsWith` reference other profile identifiers; the
  gate rejects unknown references.
- `projectTypes` uses the configuration's project types, or `all`.
- `checks` are expectations, not commands this repository runs for a project.
- Never include secrets, credentials, private addresses, or unverified claims of
  support.
