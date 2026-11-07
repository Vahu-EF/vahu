# P1-06 — Errors and logging

- **Standard ID:** P1-06
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.0
- **Applies to:** Applications, services, CLIs, libraries, and background jobs.
- **Content type:** standard
- **Lifecycle stages:** design, implementation, operations
- **Project types:** all
- **Depends on:** P1-14
- **Tags:** errors, logging, observability
- **Related:** [P1-07: Configuration](configuration.md), [P1-08: API design](api-design.md), [P1-13: Security baseline](security-baseline.md), [P1-14: Engineering decisions](engineering-decisions.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Make failures visible, actionable, and safe to inspect. A failure that is
swallowed, duplicated, or logged without context costs more to diagnose than the
defect itself.

## Scope

This standard covers how code reports failure, how errors propagate across
boundaries, and what is logged, at which level, and with what content.

## Non-goals

This standard does not:

- mandate a logging library, format, or vendor;
- define monitoring, alerting, or dashboards;
- define API error payloads. P1-08 owns the API contract;
- define retry or circuit-breaking policy for a specific stack;
- replace a security classification for data that may not be logged. P1-13
  owns that classification.

## Rules

### P1-06-R1 — Handle an error only where you can act

- **Level:** MUST
- **Rule:** Catch an error only to recover, add required context, translate it at
  a boundary, or clean up resources. Otherwise let it propagate. Do not add a
  catch block that only logs and continues.
- **Rationale:** Swallowing at intermediate layers hides the failure from the
  layer that can decide what to do and produces partial success that looks like
  success.
- **Verification:** Review each catch block. It must name the recovery or
  translation it performs.

### P1-06-R2 — Never ignore a failure silently

- **Level:** MUST NOT
- **Rule:** Do not discard an error, an error result, or a rejected promise
  without an explicit decision. If failure is acceptable, handle it explicitly
  and record why.
- **Rationale:** Silent failure is indistinguishable from success and is the
  most expensive class of defect to diagnose later.
- **Verification:** The language's lint rules and review of ignored return values
  and empty catch blocks.

### P1-06-R3 — Include context in every error

- **Level:** MUST
- **Rule:** An error reports what operation failed, on what input or identifier,
  and what the caller can do next. Do not include secrets, credentials, or
  unnecessary personal data.
- **Rationale:** An error message is read under pressure, often in a log without
  a debugger. Missing context turns one incident into an investigation.
- **Verification:** Read the message as an operator who did not write the code.
  It identifies the operation and the remedy, and exposes no secret.

### P1-06-R4 — Distinguish expected outcomes from defects

- **Level:** SHOULD
- **Rule:** Model expected, recoverable outcomes such as validation failure or a
  missing record as an explicit result the caller must handle. Reserve thrown
  errors or panics for unexpected conditions the caller cannot reasonably handle.
- **Rationale:** Using one mechanism for both forces callers to catch broadly,
  which hides defects, or to ignore results, which hides failures.
- **Verification:** Review the interface. Expected outcomes are visible in the
  signature or return type.

### P1-06-R5 — Preserve the original cause

- **Level:** MUST
- **Rule:** When wrapping or translating an error, keep the original error
  attached as the cause and keep its identifying information. Do not replace a
  cause with a generic message.
- **Rationale:** The original stack or error code is usually what identifies the
  defect; removing it turns a precise failure into a vague one.
- **Verification:** Review error wrapping for a preserved cause chain.

### P1-06-R6 — Log once, at the layer that decides

- **Level:** MUST
- **Rule:** Log a failure at the layer that decides how to respond, not at every
  layer it passes through. Do not log and rethrow the same error.
- **Rationale:** Repeated logging inflates volume, obscures the first failure,
  and makes alerting count one incident many times.
- **Verification:** Trace one failure path. It produces one log record at the
  decision point.

### P1-06-R7 — Use structured, leveled logs

- **Level:** MUST
- **Rule:** Emit structured records with a stable event name and fields rather
  than interpolated prose. Choose the level deliberately: error for failed
  operations, warn for degraded ones, info for significant state changes, and
  debug for development detail.
- **Rationale:** Structured fields can be queried and aggregated; prose can only
  be read. Level inflation makes real errors indistinguishable from noise.
- **Verification:** Review changed logging calls for structure, level, and fields.

### P1-06-R8 — Keep secrets and personal data out of logs

- **Level:** MUST NOT
- **Rule:** Do not log credentials, tokens, keys, session identifiers, full
  payment details, or unnecessary personal data. Redact or omit values at the
  logging boundary.
- **Rationale:** Logs are widely readable, retained, and exported to third-party
  systems; a logged secret is a disclosed secret.
- **Verification:** Review log statements and error payloads for sensitive
  fields. P1-13 defines the data classes that must never be logged.

### P1-06-R9 — Make user-facing messages actionable

- **Level:** SHOULD
- **Rule:** A message shown to an end user states what happened in the user's
  terms and what to do next. Keep internal identifiers, stack traces, vendor
  names, and implementation detail out of the message; correlate it with the log
  through a reference identifier.
- **Rationale:** Users cannot act on internal detail, and exposing it creates a
  security and support problem.
- **Verification:** Read the message without the code. It is understandable,
  actionable, and free of internals.

### P1-06-R10 — Correlate failures across boundaries

- **Level:** SHOULD
- **Rule:** Propagate a correlation identifier through asynchronous, service, and
  job boundaries so one user action can be traced across components.
- **Rationale:** Without a shared identifier, a failure that crosses three
  components produces three unrelated records.
- **Verification:** Review a cross-boundary flow for a propagated identifier.

## Examples

### Compliant: one decision, one record

A request handler catches a storage timeout, retries once, and on the second
failure returns a user-facing message with a reference identifier while logging
one structured error that includes the cause and the identifier.

### Compliant: an explicit result

A lookup function returns a result type that distinguishes "not found" from
"failed" so callers cannot treat a failure as absence.

### Non-compliant: log and continue

A background job catches an exception, logs it, and marks the run successful.
The next run silently processes the same broken input again.

### Non-compliant: leaked secret

A failed authentication log includes the request body, which contains the
password and the issued token.

## Exceptions

Exceptions follow P1-14-R12. A legacy integration may keep a log-and-rethrow
path while its call sites are migrated. The exception names the rule, the module,
the owner, and the removal date.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- empty catch blocks and ignored error results;
- log calls with interpolated variable content flagged for review;
- sensitive-field patterns in log statements;
- duplicate logging on one failure path.

## Related decisions

- [P1-07: Configuration](configuration.md)
- [P1-08: API design](api-design.md)
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
