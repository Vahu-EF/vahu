# P1-14 — Engineering decisions

- **Standard ID:** P1-14
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-06.
- **Version:** 0.1.0
- **Applies to:** VAHU core standards, architecture decisions, framework content, and contributions to this repository.
- **Related:** [Phase 1 specification](../../../architecture/specifications/phase-1.md), [ADR index](../../../architecture/decisions/README.md), [ADR template](../../../templates/documentation/adr.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Define how VAHU records engineering decisions and how every Phase 1 standard is
written, owned, approved, changed, and retired.

This is a process standard. It does not decide architecture, technology, or
product behaviour. It makes those decisions traceable and reviewable.

## Scope

This standard covers:

- when an Architecture Decision Record (ADR) is required;
- the ADR lifecycle and required sections;
- the ownership and approval model for standards;
- the standard-page format used by Phase 1 work packages;
- the decision index and supersession rules;
- how exceptions are recorded;
- how compliance is verified.

It applies to framework content under `packages/framework/`, architecture
records under `architecture/decisions/`, and templates under `templates/`.

## Non-goals

This standard does not:

- write the content of P1-01 through P1-13;
- define technology profiles or stack-specific rules;
- define agent adapters or generated agent files;
- approve a specific architecture, dependency, or product choice;
- add an automated validator. Executable checks belong to P1-15 after the
  content format is stable.

## Rules

### P1-14-R1 — Keep one canonical page per standard

- **Level:** MUST
- **Rule:** Each Phase 1 work package has exactly one canonical standard page.
  Core standards live at `packages/framework/core/<topic>.md`. Other framework
  areas use their own folder. Do not create a second copy for the CLI, a
  template, or the website.
- **Rationale:** Duplicate pages drift. One canonical page keeps the normative
  text traceable.
- **Verification:** Review the Phase 1 index and confirm that each work package
  links to one page.

### P1-14-R2 — Declare the standard metadata

- **Level:** MUST
- **Rule:** Every standard page declares its ID, status, owner, approver,
  approval state, version, applies-to scope, and related pages.
- **Rationale:** A reader must know whether a page is binding, who maintains it,
  and who accepted it.
- **Verification:** Review the page header against the
  [standard template](../../../templates/documentation/standard.md).

### P1-14-R3 — Give every normative rule a stable ID and level

- **Level:** MUST
- **Rule:** Use IDs in the form `<standard-id>-R<number>`, such as
  `P1-14-R3`. Use one of these levels: `MUST`, `MUST NOT`, `SHOULD`,
  `SHOULD NOT`, or `MAY`. Put one rule in each ID. Never renumber or reuse an
  ID after the standard is accepted.
- **Rationale:** Stable IDs allow reviews, exceptions, and future automated
  checks to refer to one rule without ambiguity.
- **Verification:** Check for duplicate or missing rule IDs during review.

### P1-14-R4 — Use the required standard-page sections

- **Level:** MUST
- **Rule:** A standard page contains `Purpose`, `Scope`, `Non-goals`, `Rules`,
  `Examples`, `Exceptions`, `Verification`, `Related decisions`, and
  `Change history`. Additional sections may follow the required sections.
- **Rationale:** A predictable shape makes standards easier to compare, review,
  and validate.
- **Verification:** Review the page against the standard template.

### P1-14-R5 — Name an owner and an approver

- **Level:** MUST
- **Rule:** Every standard names an owner and an approver. The owner maintains
  the content and responds to change requests. The approver accepts, rejects,
  supersedes, or retires the standard. When one person holds both roles, record
  that explicitly.
- **Rationale:** Content without ownership becomes stale. Approval without a
  named approver is not accountable.
- **Verification:** Review the metadata block.

### P1-14-R6 — Record approval explicitly

- **Level:** MUST
- **Rule:** A new standard starts as `Draft`. It becomes `Accepted` only after
  the approver records the approval date and version. A draft is informative,
  not binding. Do not mark a standard accepted on behalf of the approver.
- **Rationale:** Readers must be able to distinguish a proposal from an
  enforceable rule.
- **Verification:** Check the `Status` and `Approval` fields, plus the approval
  record.

### P1-14-R7 — Require an ADR for hard-to-reverse or cross-cutting decisions

- **Level:** MUST
- **Rule:** Create an ADR when a decision changes a public contract, data
  ownership or lifecycle, a security or trust boundary, a package or repository
  boundary, a long-lived dependency or tool, or the approval and release
  process. Require an ADR when reversing the decision would be expensive.
- **Rationale:** These decisions affect more than one change and need context
  that code comments cannot preserve.
- **Verification:** Reviewers ask for an ADR when a change matches one of these
  triggers.

### P1-14-R8 — Do not require an ADR for reversible local choices

- **Level:** SHOULD NOT
- **Rule:** Do not create an ADR for a local refactor, a private helper rename,
  formatting, a temporary experiment, or an implementation detail that can be
  reversed inside one change. Record the reason in the pull request instead.
- **Rationale:** Decision records are useful only when they are selective.
  Recording every local choice hides the important decisions.
- **Verification:** Review the pull request; no ADR is required when the change
  is local and reversible.

### P1-14-R9 — Follow the ADR lifecycle and required sections

- **Level:** MUST
- **Rule:** Use the statuses `Proposed`, `Accepted`, `Superseded`, `Rejected`,
  or `Deprecated`. A new ADR contains `Context`, `Decision`, `Consequences`,
  and links to affected files. New ADRs also record an owner, approver, and
  date. Use the [ADR template](../../../templates/documentation/adr.md).
- **Rationale:** Consistent records are searchable and reviewable years later.
- **Verification:** Review the ADR against the template and the decision index.

### P1-14-R10 — Supersede decisions; do not delete history

- **Level:** MUST
- **Rule:** When a decision changes, create a new ADR or standard version and
  mark the old one `Superseded`. Link both records with `Supersedes` and
  `Superseded by`. Do not delete or rewrite an accepted record to hide the
  earlier decision.
- **Rationale:** The reason for a change is part of the engineering record.
- **Verification:** Follow the links between the old and new records.

### P1-14-R11 — Keep the decision index current

- **Level:** MUST
- **Rule:** Every ADR appears in
  [`architecture/decisions/README.md`](../../../architecture/decisions/README.md)
  with its ID, title, status, and relative link. Update the index in the same
  change that adds or changes an ADR.
- **Rationale:** The index is the entry point for readers and future agents.
- **Verification:** Compare the ADR files with the index.

### P1-14-R12 — Record exceptions explicitly

- **Level:** MUST
- **Rule:** An exception states the rule ID, the reason, the scope, the
  approver, and an expiry or review date. Record it in the standard or in a
  linked ADR. Do not leave a silent exception in code or process.
- **Rationale:** Exceptions are decisions too. They need an owner and a way to
  end.
- **Verification:** Review the exception record and its approval.

### P1-14-R13 — Keep rules technology-neutral and non-duplicated

- **Level:** MUST
- **Rule:** Core standards state technology-independent rules. Put stack detail
  in technology profiles. Keep the normative text in one canonical page;
  templates and CLI messages may link to it but must not restate it.
- **Rationale:** VAHU must work across stacks and agents. Duplicated rule text
  becomes contradictory text.
- **Verification:** Review for stack-specific language and repeated rule text.

### P1-14-R14 — State how each rule is verified

- **Level:** MUST
- **Rule:** Each rule says whether verification is by review, a command, a test,
  or a future automated check. If a rule is executable, its check needs a test
  before the rule is marked accepted. Do not claim a rule is enforced when only
  manual review exists.
- **Rationale:** A standard without a verification path is only a suggestion.
- **Verification:** Read the `Verification` field of every rule.

### P1-14-R15 — Allow extra sections after the required sections

- **Level:** MAY
- **Rule:** Add context-specific sections after the required sections when they
  improve understanding, such as a migration note or an approval record.
- **Rationale:** The template should guide structure without preventing useful
  detail.
- **Verification:** Confirm that all required sections still appear in order.

## ADR process

### When an ADR is required

Create an ADR when a decision:

- changes a public API, schema, file format, or compatibility promise;
- changes who owns data, how long it is kept, or how it is deleted;
- changes a security or trust boundary;
- creates, removes, or changes a package or repository boundary;
- adds a long-lived dependency, tool, or platform commitment;
- changes approval, release, or compatibility policy;
- would be expensive or disruptive to reverse.

### When an ADR is not required

Do not create an ADR for:

- a local refactor with no public effect;
- a private name change;
- formatting or comment-only changes;
- a temporary experiment that is removed in the same change;
- a reversible implementation detail.

When in doubt, ask the owner. The cost of one short ADR is lower than losing the
reason for a long-lived decision.

### ADR lifecycle

| Status       | Meaning                                                  |
| ------------ | -------------------------------------------------------- |
| `Proposed`   | Drafted and waiting for approval. Not binding.           |
| `Accepted`   | Approved and binding.                                    |
| `Superseded` | Replaced by a newer ADR; kept for history.               |
| `Rejected`   | Considered and not adopted; kept when the history helps. |
| `Deprecated` | Still recorded, but no longer recommended for new work.  |

### Standard lifecycle

| Status       | Meaning                                               |
| ------------ | ----------------------------------------------------- |
| `Draft`      | Content exists but is not approved. Informative only. |
| `Accepted`   | Approved by the named approver. Binding.              |
| `Superseded` | Replaced by a newer standard; kept for history.       |
| `Retired`    | No longer applies; kept for history.                  |

### Existing Phase 0 records

ADR-0001 through ADR-0005 predate this standard. They remain accepted. New ADRs
must follow the template. An existing ADR may add an owner, approver, or
supersession link when it is next changed, but it does not need a format-only
rewrite.

## Examples

### Example: an ADR is required

A project changes its public API from offset pagination to cursor pagination.
The change affects clients, documentation, tests, and compatibility. Record an
ADR with the context, the chosen contract, the migration path, and the
consequences.

### Example: an ADR is not required

A contributor extracts a private function into a local helper. No public
contract, data boundary, or package boundary changes. Explain the refactor in
the pull request; do not add an ADR.

### Example: an exception

A standard says every new API must use cursor pagination. A legacy endpoint
cannot migrate before a fixed date. Record an exception with the rule ID, the
endpoint, the approver, and the migration date. Link the exception from the
standard's exception section.

## Exceptions

Exceptions follow P1-14-R12. They are explicit, scoped, approved, and
time-bound. An exception is not a silent edit to the rule.

## Verification

This standard is verified by review against the
[standard template](../../../templates/documentation/standard.md) and the
[ADR template](../../../templates/documentation/adr.md). The repository gate is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- duplicate or missing standard IDs;
- duplicate or missing rule IDs;
- required metadata and sections;
- ADR index completeness and broken relative links;
- supersession link consistency.

## Related decisions

- [ADR-0001](../../../architecture/decisions/ADR-0001-monorepo-boundaries.md)
- [ADR-0002](../../../architecture/decisions/ADR-0002-typescript-toolchain.md)
- [ADR-0003](../../../architecture/decisions/ADR-0003-configuration-contract.md)
- [ADR-0004](../../../architecture/decisions/ADR-0004-agent-adapter-boundary.md)
- [ADR-0005](../../../architecture/decisions/ADR-0005-apache-license.md)

## Change history

| Version | Date       | Change                                        |
| ------- | ---------- | --------------------------------------------- |
| 0.1.0   | 2026-11-06 | Initial draft; accepted by the project owner. |

## Approval record

| Version | Status   | Approver           | Date       |
| ------- | -------- | ------------------ | ---------- |
| 0.1.0   | Accepted | VAHU project owner | 2026-11-06 |
