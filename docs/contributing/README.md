# Contributing documentation

Start with the root [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Local gate

```bash
pnpm check
```

This runs formatting, linting, type checking, tests, builds, and workspace
boundary validation.

## Review checklist

- Does the change respect the framework/CLI boundary?
- Is there exactly one source of truth for the rule or profile?
- Is the status honest?
- Are new dependencies justified?
- Are tests present for behavior that can regress?
- Were generated files and secrets kept out of the commit?
- Does the change require human approval for product, architecture, brand, or
  design?

## Release work

See [release preparation](release-preparation.md) for the verified candidate
workflow and [versioning and compatibility](versioning-and-compatibility.md) for
the promises a published version would carry. Nothing is published: publication
needs an explicit release approval.
