# Guides

Phase 0 has one supported guide: validate a project configuration.

## Validate a project

```bash
pnpm dev -- validate --path examples/backend-project
```

A valid backend-only example should pass. A UI project with no approved design
system should fail with `DESIGN_SYSTEM_NOT_APPROVED`.

For each issue:

1. Read the `path` and `code` in the output.
2. Fix the configuration rather than suppressing the check.
3. Run the command again.
4. Keep approvals explicit; do not change a status merely to make validation
   green.

More guides will be added only when the corresponding framework features exist.
