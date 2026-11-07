# Security Policy

## Supported versions

VAHU is pre-release and has no published release. Release candidates are verified
but never published; security fixes currently apply to the `main` branch.

| Version              | Supported |
| -------------------- | --------- |
| `main` (pre-release) | Yes       |
| Published releases   | None yet  |

## Reporting a vulnerability

Do **not** open a public issue for a suspected vulnerability.

Use GitHub’s private vulnerability reporting for
[Vahu-EF/vahu](https://github.com/Vahu-EF/vahu/security/advisories/new) if it is
available. Otherwise, contact the organization owners through the GitHub
organization profile and ask for a private reporting channel. Do not include
exploit details, credentials, or private data in a public issue.

Please include:

- a short description of the issue;
- affected files or commands;
- reproduction steps;
- impact and any known mitigations;
- whether you want public credit.

We will acknowledge a report as soon as practical, investigate it, and agree on
a disclosure plan with the reporter. No response-time guarantee is claimed for
this pre-release project.

## Known advisories

- GHSA-g3hv-75wg-m249 (`minimatch` below `11.0.1`, denial of service through glob
  parts amplification) is remediated by a `pnpm-workspace.yaml` override to
  `^11.0.1`. It arrived transitively through eslint and typescript-eslint and was
  never part of a release candidate.

`pnpm audit` cannot run against the registry mirror configured for local
installs, so advisory tracking relies on GitHub Dependabot alerts and the weekly
security workflow. See the [threat model](docs/security/threat-model.md) for the
full review.

## Security principles for contributors

- Never commit credentials, tokens, private keys, or real `.env` values.
- Do not execute downloaded scripts automatically.
- Treat imported templates and agent instructions as untrusted until reviewed.
- Do not overwrite user-owned files silently.
- Prefer explicit confirmation and dry-run behavior for destructive operations.
- Keep dependencies minimal and review new ones.
- Do not weaken a failing security check to make CI pass.

## Scope

The repository contains documentation, a local CLI, configuration validation,
framework content, and CI workflows. It has no backend service, database,
account system, or remote API, and it does not publish packages or serve
generated agent instructions remotely.
