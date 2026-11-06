# Security Policy

## Supported versions

VAHU is in Phase 0 and has no published release. Security fixes currently apply
to the `main` branch.

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

## Security principles for contributors

- Never commit credentials, tokens, private keys, or real `.env` values.
- Do not execute downloaded scripts automatically.
- Treat imported templates and agent instructions as untrusted until reviewed.
- Do not overwrite user-owned files silently.
- Prefer explicit confirmation and dry-run behavior for destructive operations.
- Keep dependencies minimal and review new ones.
- Do not weaken a failing security check to make CI pass.

## Scope

The Phase 0 repository contains documentation, a small CLI, configuration
validation, and CI workflows. It has no backend service, database, account
system, or remote API.
