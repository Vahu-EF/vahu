# P1-04 — Naming

- **Standard ID:** P1-04
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.0
- **Applies to:** Code, tests, configuration, documentation, and user-facing text in VAHU projects.
- **Content type:** standard
- **Lifecycle stages:** design, implementation, review
- **Project types:** all
- **Depends on:** P1-03, P1-14
- **Tags:** naming, readability, conventions
- **Related:** [P1-03: Code quality](code-quality.md), [P1-01: Architecture principles](architecture-principles.md), [P1-14: Engineering decisions](engineering-decisions.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Make names carry meaning so a reader can predict what a unit does before
reading it. Naming is the cheapest documentation a project can produce and the
most expensive one to fix late.

## Scope

This standard covers the vocabulary and shape of names: modules, packages,
files, types, functions, variables, configuration keys, API fields, and test
names. It applies to new code and to names touched by a change.

## Non-goals

This standard does not:

- define capitalization, indentation, or line length. Formatters and language
  conventions own that;
- define a folder layout. P1-02 owns repository organization;
- define API contract naming or versioning. P1-08 owns API design;
- define database object naming. P1-09 owns data design;
- require a specific abbreviation list for a language.

## Rules

### P1-04-R1 — Name the concept, not the implementation

- **Level:** MUST
- **Rule:** A name states what the thing is or does in the domain, not how it is
  implemented. Prefer `retryPolicy` over `exponentialBackoffHelper`, and
  `invoiceTotal` over `sumOfLineItemAmounts`.
- **Rationale:** Implementation names become wrong after the first refactor and
  force a rename across every caller.
- **Verification:** Trace the concept to a domain term. A reader new to the
  implementation can explain the name.

### P1-04-R2 — Use one term per concept

- **Level:** MUST
- **Rule:** Use a single term for one concept across code, tests, configuration,
  documentation, and user-facing text. If two terms exist for the same concept,
  choose one and rename the other in the same change.
- **Rationale:** Synonyms hide whether two things are the same. Inconsistent
  vocabulary causes duplicated models and translation bugs.
- **Verification:** Search for known synonym pairs in the change and in the
  affected area.

### P1-04-R3 — Follow the host convention for case and form

- **Level:** MUST
- **Rule:** Use the case convention of the language, framework, and file type for
  each kind of name rather than inventing a project-specific casing scheme. Let
  the formatter or linter enforce it where one exists.
- **Rationale:** Fighting the platform convention makes code look foreign and
  breaks tooling that infers meaning from case.
- **Verification:** Compare the change with the dominant convention in the same
  file or folder.

### P1-04-R4 — Prefer pronounceable, searchable names

- **Level:** SHOULD
- **Rule:** Avoid abbreviations that are not already standard in the domain or
  the ecosystem. Avoid single-letter names except for short-lived loop indices
  or established mathematical notation.
- **Rationale:** Abbreviations must be decoded, cannot be searched reliably, and
  are often ambiguous across teams.
- **Verification:** Read the name aloud and search for it. Both should be
  unambiguous.

### P1-04-R5 — Encode units and formats when ambiguity is possible

- **Level:** MUST
- **Rule:** When a value's unit, encoding, or format is not obvious from its
  type, include it in the name, such as `timeoutMs`, `sizeBytes`, or
  `createdAtIso`.
- **Rationale:** Unit mistakes are silent and expensive: a millisecond value
  read as seconds passes review and fails in production.
- **Verification:** Review every numeric, duration, or serialized value crossing
  a boundary. Its unit is visible at the definition or the type.

### P1-04-R6 — Make booleans read as predicates

- **Level:** SHOULD
- **Rule:** Name booleans and predicates so a call site reads as a statement,
  such as `isReady`, `hasAccess`, or `canRetry`. Avoid negated names such as
  `notDisabled` and avoid double negatives in conditions.
- **Rationale:** Negated booleans invert truth at every use site and produce
  conditions that are hard to verify by reading.
- **Verification:** Read each condition in the change as a sentence.

### P1-04-R7 — Keep collection and singular names distinct

- **Level:** SHOULD
- **Rule:** Name a collection in the plural and an element in the singular. Do
  not use the same name for both, and do not name a collection for its type.
- **Rationale:** Reusing one name for both hides iteration and indexing errors,
  especially in languages without strong element typing.
- **Verification:** Review declarations and their uses for singular/plural
  mismatch.

### P1-04-R8 — Rename when the meaning changes

- **Level:** MUST
- **Rule:** When a unit's behavior or meaning changes, rename it in the same
  change. Do not keep a misleading name for compatibility inside the codebase;
  keep a deprecated public alias only with a stated removal plan.
- **Rationale:** A stale name is worse than an unfamiliar one because it is
  confidently wrong.
- **Verification:** Review the diff. Behavior changes include name changes and
  call-site updates.

## Examples

### Compliant: names that state the concept

`calculateInvoiceTotal(lineItems, taxRate)`, `isEligibleForRefund(order)`, and
`retryPolicy` are readable at the call site without opening the implementation.

### Compliant: unit in the name

`requestTimeoutMs` and `maxUploadSizeBytes` prevent two of the most common
integration defects.

### Non-compliant: implementation leakage

`sumOfLineItemAmountsAndApplyTax` describes the current algorithm, which will
change the first time discounts are added.

### Non-compliant: negation

A flag named `isNotReady` used as `if (!isNotReady)` requires two negations to
recover the intended meaning.

## Exceptions

Exceptions follow P1-14-R12. A rename that would break a published contract may
keep the old public name as a deprecated alias. The exception names the rule,
the affected symbol, the owner, and the removal date.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- identifier case rules delegated to the language linter;
- unit suffix lists for numeric configuration keys;
- deprecated alias expiry checks.

## Related decisions

- [P1-03: Code quality](code-quality.md)
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
