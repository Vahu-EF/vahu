# P1-09 — Data design

- **Standard ID:** P1-09
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.0
- **Applies to:** Persistent stores, schemas, migrations, and any data the system owns or processes.
- **Content type:** standard
- **Lifecycle stages:** design, implementation, operations
- **Project types:** all
- **Depends on:** P1-01, P1-14
- **Tags:** data, schema, migrations
- **Related:** [P1-08: API design](api-design.md), [P1-13: Security baseline](security-baseline.md), [P1-01: Architecture principles](architecture-principles.md), [P1-14: Engineering decisions](engineering-decisions.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Treat stored data as the most expensive part of a system to change. Schemas,
constraints, and lifecycle rules written early prevent data loss, silent
corruption, and migrations that cannot be reversed.

## Scope

This standard covers data modeling, ownership, constraints, migrations, deletion,
retention, and handling of production data. It applies to relational and
non-relational stores, files, and caches that hold authoritative data.

## Non-goals

This standard does not:

- prescribe a database engine or a normal form;
- define query performance tuning for a specific engine;
- define API response shapes. P1-08 owns those;
- define backup tooling or provider configuration;
- replace legal or regulatory advice on data retention.

## Rules

### P1-09-R1 — Give every store a named owner and a purpose

- **Level:** MUST
- **Rule:** Each data store and each table or collection has a named owner and a
  stated purpose. Do not create a shared store without an owner and a documented
  contract for its consumers.
- **Rationale:** An unowned store becomes a dumping ground that nobody dares
  migrate and everybody reads directly.
- **Verification:** Review the data documentation for owners and purposes.

### P1-09-R2 — Model the domain, not the current screen

- **Level:** SHOULD
- **Rule:** Model entities and relationships around domain meaning. Do not shape
  the schema around a single UI view or a single endpoint.
- **Rationale:** Screen-driven schemas duplicate data and force a migration every
  time the interface changes.
- **Verification:** Review the schema against the domain glossary. Each entity
  has a reason to exist beyond one presentation.

### P1-09-R3 — Enforce invariants in the store

- **Level:** MUST
- **Rule:** Express uniqueness, required relationships, referential integrity, and
  allowed value ranges as store constraints, not only as application checks. When
  a constraint cannot be expressed, document the application-level enforcement
  and its test.
- **Rationale:** Application checks can be bypassed by another writer, a script,
  or a bug. The store is the last place an invariant can be guaranteed.
- **Verification:** Review the schema for constraints and compare them with the
  validation rules in code.

### P1-09-R4 — Migrate forward with a reviewed, reversible-or-restorable step

- **Level:** MUST
- **Rule:** Every schema change ships as a versioned migration that can run on the
  existing data. State whether it is reversible; when it is not, state the restore
  plan. Review the migration separately from the feature that uses it.
- **Rationale:** An irreversible migration without a restore plan converts a
  coding mistake into permanent data loss.
- **Verification:** Review the migration for existing-data handling, ordering, and
  the stated rollback or restore path.

### P1-09-R5 — Make identifiers, timestamps, and deletion explicit

- **Level:** MUST
- **Rule:** Every record has a stable identifier and recorded creation time. State
  whether deletion is physical or logical, who may perform it, and what happens to
  dependent records.
- **Rationale:** Implicit deletion semantics produce orphaned rows, resurrected
  records, and audit gaps discovered long after the fact.
- **Verification:** Review the schema and the deletion path for a stated policy.

### P1-09-R6 — Classify and minimize personal data

- **Level:** MUST
- **Rule:** Identify which fields contain personal or sensitive data, store only
  what the feature needs, and state a retention period and a deletion mechanism
  for each. Do not copy such data into logs, fixtures, or analytics without an
  approved reason.
- **Rationale:** Data that is not collected cannot leak, and data without a
  retention rule is kept forever by default.
- **Verification:** Review the data documentation for classification, necessity,
  and retention.

### P1-09-R7 — Keep production data out of development

- **Level:** MUST NOT
- **Rule:** Do not copy production data into development, test, or demonstration
  environments unless it is approved, masked, and covered by an access rule.
  Prefer generated fixtures.
- **Rationale:** Every copy of production data multiplies the exposure surface and
  is usually outside the controls that protect the original.
- **Verification:** Review fixtures and environment setup for the data source.

### P1-09-R8 — Test backup and restore, not only backup

- **Level:** SHOULD
- **Rule:** A store with authoritative data has a documented backup schedule and a
  restore procedure that has been exercised. Record the last successful restore
  test and its date.
- **Rationale:** An untested backup is a hypothesis. Restore failures are
  discovered exactly when they are most expensive.
- **Verification:** Review the operations documentation for the restore procedure
  and its last test date.

### P1-09-R9 — Evolve schema and contract together

- **Level:** MUST
- **Rule:** When a schema change alters a published contract, update the contract,
  the migration, and the consumers in one coordinated change with a compatibility
  window.
- **Rationale:** A schema change that outruns its contract breaks consumers
  silently, and a contract that outruns its schema promises data that does not
  exist.
- **Verification:** Review the change set for schema, contract, and consumer
  updates together.

## Examples

### Compliant: constraint in the store

An email uniqueness rule is a unique constraint in the database, and the
application check exists only to produce a friendly error. A second writer cannot
create a duplicate.

### Compliant: reversible migration

A new nullable column is added, backfilled in a separate step, and only then made
required. Each step can run while the previous version is serving traffic.

### Non-compliant: destructive migration

A column is dropped in the same deploy that stops reading it. A rollback of the
application now fails because the data no longer exists.

### Non-compliant: production copy

A developer restores a production dump locally to reproduce a bug, including
customer records, and keeps it on a laptop.

## Exceptions

Exceptions follow P1-14-R12. A legacy store may lack constraints while a
normalization project is in progress. The exception names the rule, the table,
the owner, the compensating check, and the completion date.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- migration files paired with a stated rollback or restore plan;
- personal-data fields present in the data documentation;
- fixture data sources checked for production origin;
- schema constraint coverage for declared invariants.

## Related decisions

- [P1-08: API design](api-design.md)
- [P1-13: Security baseline](security-baseline.md)
- [P1-01: Architecture principles](architecture-principles.md)
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
