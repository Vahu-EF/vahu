# Technology profiles

Status: **Implemented for the first profiles.**

This is the **only canonical technology-profile location**. There is no root
`profiles/` directory.

A profile is JSON validated by `profile.schema.json` in `@vahu-ef/schemas`. It
applies only when a project selects its technology; nothing here is a default.

| Profile                     | Category | Technology   |
| --------------------------- | -------- | ------------ |
| `PROFILE-NODE-BACKEND.json` | backend  | `node`       |
| `PROFILE-POSTGRESQL.json`   | database | `postgresql` |
| `PROFILE-VITEST.json`       | testing  | `vitest`     |

## Authoring

1. Copy [the profile template](PROFILE_TEMPLATE.md) and fill every field.
2. Use a stable identifier: `PROFILE-<TECHNOLOGY>`.
3. Declare `supportedVersions`, `projectTypes`, and any `prerequisites` or
   `conflictsWith`. Never leave limitations implicit.
4. Add the file and run `pnpm validate:profiles`.

The gate checks schema validity, duplicate identifiers, unknown references, and
prerequisite cycles. It does not claim a profile is verified against a real
project; that remains a maintainer judgement.

A project selects profiles through the technology values it records. Conflicts
and missing prerequisites are reported by `evaluateProfileSelection`, with the
profile that introduced each issue.
