# P1-12 — Documentation

- **Standard ID:** P1-12
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.0
- **Applies to:** Repository documentation, public interfaces, operations, and decision records.
- **Content type:** standard
- **Lifecycle stages:** planning, implementation, release, operations
- **Project types:** all
- **Depends on:** P1-14
- **Tags:** documentation, adr, operations
- **Related:** [P1-14: Engineering decisions](engineering-decisions.md), [P1-11: Code review](code-review.md), [P1-02: Repository organization](repository-organization.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Keep documentation true, findable, and minimal. Documentation is part of the
implementation: a feature nobody can operate or a contract nobody can read is not
finished.

## Scope

This standard covers what documentation a project keeps, where it lives, how it
is kept current, and how status is communicated to a reader.

## Non-goals

This standard does not:

- mandate a documentation site generator;
- define the standard-page or ADR format. P1-14 owns those templates;
- define API contract content. P1-08 owns API design;
- require documentation for private, obvious helpers;
- replace code comments, which explain local intent.

## Rules

### P1-12-R1 — Ship documentation with the change it describes

- **Level:** MUST
- **Rule:** A change that alters behavior a user, operator, or integrator depends
  on updates the affected documentation in the same change. Do not file
  documentation as unconditional follow-up work.
- **Rationale:** Deferred documentation is written from memory, usually by nobody,
  and the gap is discovered by the first person who needs it.
- **Verification:** Review the change for documentation updates matching the
  behavior change.

### P1-12-R2 — Keep one source of truth per fact

- **Level:** MUST
- **Rule:** State a fact in one canonical location and link to it from elsewhere.
  Do not copy the same procedure, rule, or value into several pages.
- **Rationale:** Copies drift, and a reader has no way to know which copy is
  current.
- **Verification:** Search for repeated procedures or duplicated rule text and
  consolidate or replace with links.

### P1-12-R3 — Answer what, why, how, and how to verify

- **Level:** MUST
- **Rule:** A repository README states what the project is, why it exists, how to
  run it from a clean checkout, and how to verify that it works. Keep the first
  successful path short and current.
- **Rationale:** The README is the entry point that decides whether a new
  contributor can start at all.
- **Verification:** Follow the README on a clean checkout without using other
  pages.

### P1-12-R4 — Record decisions as decision records

- **Level:** MUST
- **Rule:** A decision that meets the P1-14 triggers is recorded as an ADR, not
  only as a paragraph in a design page or a review comment. Keep the decision
  index current.
- **Rationale:** A decision buried in prose cannot be found, reviewed, or
  superseded deliberately.
- **Verification:** Review the change for the ADR and the index entry when a
  trigger applies.

### P1-12-R5 — Document public interfaces and data contracts

- **Level:** MUST
- **Rule:** A published interface has documentation covering operations, inputs,
  outputs, errors, limits, and compatibility policy. A data contract documents
  ownership, lifecycle, and migration expectations.
- **Rationale:** Consumers cannot safely integrate with a contract they must
  discover by experiment.
- **Verification:** Compare the interface documentation with the contract for
  completeness.

### P1-12-R6 — Document operations before they are needed

- **Level:** SHOULD
- **Rule:** A deployable system documents how to deploy, roll back, restore data,
  rotate credentials, and respond to a failure of its critical dependencies.
  Include the command or location for each step.
- **Rationale:** Operations documentation is read during an incident, when there
  is no time to reverse-engineer the system.
- **Verification:** Review the operations documentation against a recent
  deployment or incident.

### P1-12-R7 — State status explicitly

- **Level:** MUST
- **Rule:** Describe incomplete work with an explicit status such as
  `Implemented`, `In Progress`, or `Planned`. Do not describe a planned capability
  as available, and do not leave a status claim that the code contradicts.
- **Rationale:** A reader who trusts an inaccurate status builds on something that
  does not exist and loses trust in the rest of the documentation.
- **Verification:** Compare each status claim with the implementation and the
  repository checks.

### P1-12-R8 — Keep examples runnable or labeled illustrative

- **Level:** MUST
- **Rule:** An example command or configuration either runs as written against the
  current version or is explicitly labeled as illustrative. Update or remove an
  example that no longer works.
- **Rationale:** A broken example is worse than no example because it looks
  authoritative and consumes the reader's time.
- **Verification:** Run the documented commands or confirm the illustrative label.

### P1-12-R9 — Keep documentation links valid

- **Level:** MUST
- **Rule:** Relative links in repository documentation resolve. When a page moves,
  update its inbound links in the same change.
- **Rationale:** Broken links hide the fact that a page was moved or deleted and
  strand readers mid-task.
- **Verification:** The standards validator checks relative links in standard
  pages and decision records; review covers the rest.

## Examples

### Compliant: documentation with the change

A change to a readiness rule updates the concept page, the CLI help text, and the
test that states the expected behavior in one reviewable change.

### Compliant: status that matches the code

A capability table marks a module `Planned` and links to no canonical page,
because no page exists yet.

### Non-compliant: duplicated procedure

The release procedure is copied into the README, the contributing guide, and a
wiki page. They disagree about which workflow to run.

### Non-compliant: aspirational documentation

A guide documents a command that the CLI does not implement, with no status
label. Readers report a bug rather than a missing feature.

## Exceptions

Exceptions follow P1-14-R12. A page may link to an external resource for a
procedure the project does not own. The exception names the rule, the page, the
owner, and the review date for the external reference.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
pnpm validate:standards
```

The standards validator covers relative-link resolution, required standard-page
sections, and decision-index completeness. The following checks are planned for
P1-15 and are not implemented yet:

- status labels matched against the implementation;
- required operations pages for deployable packages;
- broken-link checks for documentation outside `packages/framework/` and
  `architecture/decisions/`.

## Related decisions

- [P1-14: Engineering decisions](engineering-decisions.md)
- [P1-11: Code review](code-review.md)
- [P1-02: Repository organization](repository-organization.md)

## Change history

| Version | Date       | Change                         |
| ------- | ---------- | ------------------------------ |
| 0.1.0   | 2026-11-07 | Initial draft.                 |
| 0.1.0   | 2026-11-07 | Accepted by the project owner. |

## Approval record

| Version | Status   | Approver           | Date       |
| ------- | -------- | ------------------ | ---------- |
| 0.1.0   | Accepted | VAHU project owner | 2026-11-07 |
