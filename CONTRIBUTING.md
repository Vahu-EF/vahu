# Contributing to VAHU

Thank you for considering a contribution. VAHU is an early-stage framework, so
small, well-tested changes are more useful than large speculative additions.

## Before you start

1. Read [`VAHU.md`](VAHU.md) for the product foundation.
2. Read the relevant [architecture decision](architecture/decisions/).
3. Check [the current status](README.md#project-status) so you do not assume a
   planned feature already exists.
4. Open an issue for a substantial change before writing a large patch.

## Development setup

Requirements:

- Node.js 22 or newer
- pnpm 10 or newer

```bash
pnpm install
pnpm check
```

The main checks are:

`pnpm format` applies Biome formatting; `pnpm format:check` verifies it without
writing changes. Biome also runs the repository's lint rules through `pnpm lint`.

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm validate:workspace
pnpm validate:standards
```

A pull request should pass the same checks locally that CI runs.

Adding or changing a standard page means following
[P1-14](packages/framework/core/engineering-decisions.md) and the
[standard template](templates/documentation/standard.md). `pnpm validate:standards`
checks the page structure and links. Do not mark a standard `Accepted` on the
approver's behalf.

## Repository boundaries

- `packages/framework/` contains reusable framework knowledge and must not
  import CLI code.
- `packages/framework/technology-profiles/` is the only canonical technology
  profile location.
- `packages/core/` contains reusable executable logic.
- `packages/schemas/` owns configuration contracts and validation types.
- `apps/cli/` is the thin terminal interface.
- `apps/website/` is independent of the CLI runtime.
- `templates/` contains material intended to be copied or generated into a user
  project.
- Do not add a second source of truth for the same rule or profile.

## Coding rules

- Use TypeScript for executable code.
- Keep the CLI presentation separate from validation logic.
- Prefer the smallest dependency that clearly solves the problem.
- Add a test for behavior that can regress.
- Do not claim an implementation status that the code does not support.
- Do not add an agent adapter that has not been tested against that agent.
- Do not add a backend, database, or remote service in Phase 0.

## Commit messages

Use conventional commits:

```text
feat: add a user-visible capability
fix: correct a defect
refactor: change structure without changing behavior
docs: update documentation
test: add or change tests
chore: update tooling or dependencies
```

Keep the subject under about 72 characters. Explain the reason in the body when
it is not obvious.

## Pull requests

Use the pull-request template. Include:

- the problem;
- the smallest change made;
- the checks you ran;
- any limitations or follow-up work;
- whether a product, brand, legal, or architecture decision is still needed.

Do not force-push a shared branch. Do not commit secrets, `.env` files, tokens,
or private server addresses.

## Reporting security issues

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md).
