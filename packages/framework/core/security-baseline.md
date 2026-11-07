# P1-13 — Security baseline

- **Standard ID:** P1-13
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.0
- **Applies to:** Every project that stores data, accepts input, or runs in a shared environment.
- **Content type:** standard
- **Lifecycle stages:** design, implementation, review, operations
- **Project types:** all
- **Depends on:** P1-05, P1-07, P1-14
- **Tags:** security, secrets, access
- **Related:** [P1-05: Dependencies](dependencies.md), [P1-07: Configuration](configuration.md), [P1-09: Data design](data-design.md), [P1-11: Code review](code-review.md), [P1-14: Engineering decisions](engineering-decisions.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

State the minimum security expectations every project meets, in terms a reviewer
can check. Security work that depends on someone remembering to think about it is
not a baseline.

## Scope

This standard covers trust boundaries, secret handling, identity and access,
input handling, dependency risk, data protection, security logging, and
vulnerability response. It applies to application code, infrastructure
configuration, and repository practice.

## Non-goals

This standard does not:

- replace a threat model for a specific system;
- define compliance certification or a regulatory control set;
- mandate a specific identity provider or secret manager;
- define incident communication policy;
- guarantee that meeting the baseline makes a system secure.

## Rules

### P1-13-R1 — Name the trust boundaries

- **Level:** MUST
- **Rule:** Document each boundary where data or control crosses a trust change,
  such as public client to server, server to third party, or one service to
  another, and what is validated at that boundary.
- **Rationale:** A control is only meaningful relative to a boundary; undocumented
  boundaries leave gaps nobody assigned.
- **Verification:** Review the architecture documentation for named boundaries and
  their controls.

### P1-13-R2 — Never store secrets in version control

- **Level:** MUST NOT
- **Rule:** Do not commit credentials, tokens, private keys, or secret-bearing
  environment files. Supply secrets from the environment or a secret manager, keep
  local files ignored, and enable secret scanning.
- **Rationale:** Repository content is copied, cached, and retained; a secret in
  history must be treated as disclosed.
- **Verification:** Review ignore rules and configuration. Secret scanning runs in
  CI, and P1-07 covers the configuration path.

### P1-13-R3 — Rotate a secret that may have been exposed

- **Level:** MUST
- **Rule:** A secret that appears in a commit, a log, a build artifact, or a shared
  message is rotated, and the exposure is recorded. Removing the value from the
  working tree is not a fix.
- **Rationale:** Removal does not revoke the credential, and copies may already
  exist outside the repository.
- **Verification:** Review the incident or change record for rotation and the
  affected scope.

### P1-13-R4 — Authenticate, authorize, and apply least privilege

- **Level:** MUST
- **Rule:** Every non-public operation authenticates its caller and authorizes the
  specific action on the specific resource. Grant the narrowest permission that
  works, and deny by default.
- **Rationale:** Authentication without per-resource authorization lets any
  authenticated caller reach any record; broad permissions turn one bug into a
  full compromise.
- **Verification:** Review each entry point for authentication and an ownership or
  role check, plus a test for a foreign-resource request.

### P1-13-R5 — Validate and encode untrusted input

- **Level:** MUST
- **Rule:** Validate untrusted input against an expected shape at the boundary, and
  encode or parameterize it for its destination: query, shell, template, path, or
  header. Never build a query or command by string concatenation from input.
- **Rationale:** Injection defects come from a single unencoded path and are among
  the most damaging classes of vulnerability.
- **Verification:** Review data flow from each external input to each sink, with
  tests for rejected input.

### P1-13-R6 — Keep dependencies patched and reviewed

- **Level:** MUST
- **Rule:** Review new dependencies for maintenance, license, and known
  vulnerabilities. Apply high-severity security updates promptly, and remove
  dependencies that are no longer used.
- **Rationale:** Third-party code runs with the application's privileges, and an
  unpatched dependency is a known entry point.
- **Verification:** Review dependency changes and the security workflow results.

### P1-13-R7 — Protect data in transit and at rest

- **Level:** MUST
- **Rule:** Use current transport encryption for any network path that carries
  credentials or personal data, and encrypt stored sensitive data with a managed
  key. Do not disable certificate validation or substitute a weaker protocol for
  convenience.
- **Rationale:** Unencrypted paths expose data to anyone on the route, and a
  disabled validation check turns encryption into decoration.
- **Verification:** Review transport and storage configuration for the affected
  path.

### P1-13-R8 — Log security events without secrets

- **Level:** MUST
- **Rule:** Record authentication failures, authorization denials, and
  administrative actions with enough context to investigate. Never log
  credentials, tokens, session identifiers, or unnecessary personal data.
- **Rationale:** Security events are needed to detect and reconstruct abuse, but a
  log full of secrets is its own incident.
- **Verification:** Review security logging for event coverage and sensitive
  fields. P1-06 covers logging mechanics.

### P1-13-R9 — Provide a vulnerability reporting path

- **Level:** MUST
- **Rule:** A project that handles other people's data publishes how to report a
  vulnerability privately, commits to acknowledging reports, and does not require
  a public issue for a suspected vulnerability.
- **Rationale:** Without a private path, reporters either stay silent or disclose
  publicly before a fix exists.
- **Verification:** Review the security policy and its reporting channel.

### P1-13-R10 — Threat-model changes that move a boundary

- **Level:** MUST
- **Rule:** A change that adds a public endpoint, a new third party, a new data
  store, or a new privileged operation includes a short threat assessment: what
  crosses the boundary, who can reach it, and what limits the damage.
- **Rationale:** New boundaries are where unconsidered risk enters; the change is
  the cheapest moment to reason about it.
- **Verification:** Review the change for the assessment and the controls it
  identifies.

## Examples

### Compliant: per-resource authorization

A document endpoint loads the record, compares its owner with the authenticated
caller, and returns not-found for a foreign record. A test covers the
cross-account case.

### Compliant: parameterized access

A query is executed with bound parameters. An input containing a quote or a
statement fragment is stored as data and cannot alter the statement.

### Non-compliant: identity without authorization

Every authenticated caller can read any invoice by changing the identifier in the
path. The endpoint "requires login", which is mistaken for access control.

### Non-compliant: exposed key

A build log prints the full environment, including a deployment token. The token
is not rotated because the log is "internal".

## Exceptions

Exceptions follow P1-14-R12. A temporary exception for a legacy system names the
rule, the affected scope, the compensating control, the owner, and an expiry date.
An exception that reduces a control on personal data needs an explicit approver
record.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- secret scanning across the working tree and history;
- dependency vulnerability review in CI;
- authorization test presence for non-public entry points;
- security policy presence.

## Related decisions

- [P1-05: Dependencies](dependencies.md)
- [P1-07: Configuration](configuration.md)
- [P1-09: Data design](data-design.md)
- [P1-11: Code review](code-review.md)
- [P1-14: Engineering decisions](engineering-decisions.md)

## Change history

| Version | Date       | Change                         |
| ------- | ---------- | ------------------------------ |
| 0.1.0   | 2026-11-07 | Initial draft.                 |
| 0.1.0   | 2026-11-07 | Accepted by the project owner. |

## Approval record

| Version | Status   | Approver           | Date       |
| ------- | -------- | ------------------ | ---------- |
| 0.1.0   | Accepted | VAHU project owner | 2026-11-07 |
