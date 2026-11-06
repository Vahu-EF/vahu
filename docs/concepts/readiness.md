# Readiness rules

`vahu validate` combines structural schema validation with the Phase 0 readiness
rules. The schema checks required fields, field types, allowed values, and unknown
properties. The readiness layer checks the relationships between those fields.

## Blocking issues

| Code                           | Condition                                  |
| ------------------------------ | ------------------------------------------ |
| `CONFIG_MISSING`               | `.vahu/project.json` does not exist        |
| `CONFIG_UNREADABLE`            | The file cannot be read                    |
| `CONFIG_INVALID_JSON`          | The file is not valid JSON                 |
| `CONFIG_SCHEMA`                | A field is missing, malformed, or unknown  |
| `IDENTITY_NOT_APPROVED`        | Project Identity is still pending          |
| `DESIGN_SYSTEM_NOT_APPROVED`   | A UI project has no approved design system |
| `DESIGN_SYSTEM_SOURCE_MISSING` | An approved design system has no source    |

## Recommendations

These do not make `validate` fail:

- pending brand assets;
- an approved UI design system with no recorded path;
- no selected technology;
- an undocumented multi-repository or hybrid strategy;
- readiness marked `ready` while blocking issues remain;
- readiness marked `blocked` without a blocking issue.

## Important non-rules

A backend-only project is not blocked by a missing logo or brand. It can use
`brand.status: "not-applicable"` and `designSystem.status: "not-applicable"`.

The readiness field is recorded configuration, not a claim that the project is
finished. `vahu validate` reports the current blocking issues; it does not edit
the file or mark it approved.
