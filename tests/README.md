# Cross-package tests

Package-level unit tests live beside their source. This folder is reserved for
tests that cross package boundaries or exercise a real CLI process.

The Phase 0 CLI smoke tests currently live in `apps/cli/tests/` because they
belong to the CLI package.

Future areas:

- `integration/` — generated projects and end-to-end command flows.
- `fixtures/` — reusable project configurations and malformed examples.
- `compatibility/` — agent and Node.js version checks.
