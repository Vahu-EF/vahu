# Guides

This section provides task-oriented guidance for the current CLI and framework capabilities. The docs are evolving in Phase 7; see the [command reference](../cli/README.md) for the complete implemented command list.

## Validate a project

```bash
pnpm dev -- validate --path examples/backend-project
pnpm dev -- project inspect --path examples/backend-project
pnpm dev -- profile list
```

A valid backend-only example should pass. A UI project with no approved design
system should fail with `DESIGN_SYSTEM_NOT_APPROVED`.

For each issue:

1. Read the `path` and `code` in the output.
2. Fix the configuration rather than suppressing the check.
3. Run the command again.
4. Keep approvals explicit; do not change a status merely to make validation
   green.

The five committed example configurations are validated by the CLI integration suite. Profile listing and validation are available; applying profiles, synchronizing agents, and executing workflow gates are not implemented.
