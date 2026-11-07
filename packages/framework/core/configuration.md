# P1-07 — Configuration

- **Standard ID:** P1-07
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.0
- **Applies to:** Applications, services, CLIs, build tooling, and deployment manifests.
- **Content type:** standard
- **Lifecycle stages:** design, implementation, operations
- **Project types:** all
- **Depends on:** P1-06, P1-14
- **Tags:** configuration, secrets, environments
- **Related:** [P1-06: Errors and logging](errors-and-logging.md), [P1-13: Security baseline](security-baseline.md), [ADR-0003](../../../architecture/decisions/ADR-0003-configuration-contract.md), [P1-14: Engineering decisions](engineering-decisions.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Make the difference between code and environment explicit, validated, and
reviewable. Misconfiguration is a leading cause of outages, and most of it comes
from unvalidated values and undocumented keys.

## Scope

This standard covers how an application reads configuration, how keys are
documented and validated, how environments differ, how secrets are supplied, and
how configuration changes are reviewed.

## Non-goals

This standard does not:

- mandate a configuration library, file format, or secret manager;
- define infrastructure provisioning or platform policy;
- define the project's own `.vahu/project.json` schema, which P1-14 and the
  schema package own;
- replace the security rules for secret storage. P1-13 owns those.

## Rules

### P1-07-R1 — Read configuration once, at startup, and validate it

- **Level:** MUST
- **Rule:** Resolve and validate configuration at a single startup boundary, then
  pass typed values to the rest of the system. Fail startup when required
  configuration is missing or malformed.
- **Rationale:** Scattered lookups and late failures turn a configuration error
  into an intermittent runtime failure in an arbitrary request.
- **Verification:** Review the startup path. Configuration is parsed once and the
  failure is immediate and named.

### P1-07-R2 — Keep code identical across environments

- **Level:** MUST
- **Rule:** Deploy the same build artifact to every environment and vary only
  configuration supplied from outside it. Do not branch on an environment name
  inside application code.
- **Rationale:** Environment-specific builds mean the artifact that was tested is
  not the artifact that runs, and environment branches accumulate untested paths.
- **Verification:** Trace one deployed artifact across environments. Behavior
  differs only through configuration.

### P1-07-R3 — Never store secrets in the repository

- **Level:** MUST NOT
- **Rule:** Do not commit credentials, tokens, keys, private certificates, or
  environment files containing them. Supply secrets from the environment or a
  secret manager, and keep local secret files untracked and ignored.
- **Rationale:** Repository history is widely readable and effectively permanent;
  a committed secret must be treated as compromised.
- **Verification:** Review the diff and ignore rules. Secret scanning runs in CI.
  See P1-13 for the response when a secret is exposed.

### P1-07-R4 — Fail fast with a message that names the key

- **Level:** MUST
- **Rule:** A configuration failure reports the key, the expected form, and
  where it is supplied. Do not report a generic "invalid configuration" message
  or echo the offending secret value.
- **Rationale:** The operator reading the message is often mid-incident; the key
  name is the shortest path to a fix.
- **Verification:** Trigger a missing and a malformed value. Both messages name
  the key and the expected form.

### P1-07-R5 — Document every configuration key

- **Level:** MUST
- **Rule:** Each key has a documented purpose, type, whether it is required, its
  default when one exists, and its allowed values. Keep the documentation next to
  the schema or validation that enforces it.
- **Rationale:** Undocumented keys are guessed at or copied, and a default that
  nobody recorded becomes an accidental contract.
- **Verification:** Compare the key list in code with the configuration
  documentation.

### P1-07-R6 — Default safely

- **Level:** MUST NOT
- **Rule:** Do not default a security-relevant setting to a permissive value,
  such as disabled authentication, open origins, or verbose error detail. Prefer
  a required value or a restrictive default.
- **Rationale:** A missing value in a new environment silently disables the
  protection the code assumed.
- **Verification:** Review defaults for security-sensitive keys and confirm the
  restrictive choice.

### P1-07-R7 — Define and document precedence

- **Level:** SHOULD
- **Rule:** When several sources can supply a value, define one precedence order
  and document it, for example explicit argument, environment, file, default.
  Apply it consistently.
- **Rationale:** Unstated precedence makes a deployment behave differently from
  what its manifest suggests and makes overrides unpredictable.
- **Verification:** Review the resolution order and test an override case.

### P1-07-R8 — Version and migrate configuration deliberately

- **Level:** MUST
- **Rule:** Give a versioned configuration format an explicit version and a
  migration path. Reject unknown fields rather than ignoring them, and never
  change the meaning of an existing key without a migration.
- **Rationale:** Silent field acceptance hides typos, and a silent meaning change
  breaks every existing deployment without warning.
- **Verification:** Review the schema and its tests. A malformed or unknown field
  fails with an actionable message.

## Examples

### Compliant: one validated boundary

A service parses its environment into a typed object during startup, validates
required keys, and passes that object to handlers. A missing database URL stops
the process with a message naming the key.

### Compliant: a restrictive default

An optional origin allowlist is empty by default, so a misconfigured deployment
refuses cross-origin requests instead of accepting every origin.

### Non-compliant: environment branching

Code checks an environment name and enables a debug backdoor in anything that is
not production. The name is misspelled in one environment and the backdoor is
reachable.

### Non-compliant: secrets in configuration

A local development file with a live API key is committed "temporarily" and
removed in a later commit. The key remains in history.

## Exceptions

Exceptions follow P1-14-R12. A legacy service may read a subset of configuration
lazily while its startup path is migrated. The exception names the rule, the
keys, the owner, and the completion date.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- configuration key documentation completeness;
- unknown-field rejection covered by tests;
- secret scanning in CI;
- permissive security defaults flagged for review.

## Related decisions

- [ADR-0003: Configuration contract](../../../architecture/decisions/ADR-0003-configuration-contract.md)
- [P1-06: Errors and logging](errors-and-logging.md)
- [P1-13: Security baseline](security-baseline.md)
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
