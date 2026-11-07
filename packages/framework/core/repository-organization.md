# P1-02 — Repository organization

- **Standard ID:** P1-02
- **Status:** Accepted
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Approval:** Approved by VAHU project owner on 2026-11-07.
- **Version:** 0.1.0
- **Applies to:** Source repositories, monorepos, and multi-repository projects.
- **Content type:** standard
- **Lifecycle stages:** design, implementation
- **Project types:** all
- **Depends on:** P1-01, P1-14
- **Tags:** repository, layout, boundaries
- **Related:** [P1-01: Architecture principles](architecture-principles.md), [P1-14: Engineering decisions](engineering-decisions.md), [Phase 1 specification](../../../architecture/specifications/phase-1.md), [standard template](../../../templates/documentation/standard.md)

## Purpose

Give a reader a predictable place to find code, tests, documentation, and
generated artifacts. Repository layout is the first architecture a contributor
meets; when it is arbitrary, every later convention has to be relearned.

## Scope

This standard covers the top-level layout of a repository, the separation of
source from generated output, the placement of tests and documentation, and the
rules for adding a new top-level folder. It applies to new repositories and to
restructuring an existing one.

## Non-goals

This standard does not:

- prescribe a feature-first or type-first internal layout. Either can comply;
- define package boundaries or dependency direction. P1-01 owns those rules;
- define naming rules. P1-04 owns naming;
- define documentation content. P1-12 owns documentation;
- require a specific monorepo tool.

## Rules

### P1-02-R1 — Give each repository one stated purpose

- **Level:** MUST
- **Rule:** A repository has one stated purpose and one root. Do not nest an
  independent project under another project's source tree; use a workspace, a
  separate repository, or an explicitly documented subproject instead.
- **Rationale:** A nested project inherits tooling, hooks, and configuration it
  did not choose, and its ownership becomes ambiguous.
- **Verification:** Review the root README and the top-level tree. Every
  top-level folder serves the stated purpose.

### P1-02-R2 — Separate source from generated output

- **Level:** MUST
- **Rule:** Generated artifacts, build output, caches, and coverage reports live
  in a dedicated, ignored directory. Commit generated files only when the file
  is a published contract, and state that reason in the repository.
- **Rationale:** Mixing generated output with source makes review noisy and
  invites hand edits to files that will be overwritten.
- **Verification:** Review ignore rules and the diff. A generated file that is
  committed has a documented reason and a reproducible command.

### P1-02-R3 — Keep one canonical location per artifact type

- **Level:** MUST
- **Rule:** Each kind of artifact has exactly one home: one test location
  convention, one documentation root, one configuration root, one migration
  location. Do not add a second folder for the same kind of file.
- **Rationale:** Two homes for the same artifact force contributors to guess and
  make automated checks unreliable.
- **Verification:** Search for duplicate roles, such as two test roots or two
  documentation trees. The repository documents the chosen location.

### P1-02-R4 — Co-locate what changes together

- **Level:** SHOULD
- **Rule:** Prefer placing a unit's implementation, tests, and local
  documentation near each other. Keep genuinely shared code in a named, owned
  location instead of a general-purpose folder.
- **Rationale:** Change usually touches a feature and its evidence together.
  Co-location keeps a review focused and makes removal easy.
- **Verification:** Review a recent change. Its files should be discoverable
  without searching unrelated trees.

### P1-02-R5 — Name folders for a stable concept

- **Level:** SHOULD
- **Rule:** Name a folder for the domain concept or responsibility it holds, not
  for a tool, a person, or a temporary project phase. Avoid folder names such as
  `misc`, `temp`, `new`, `old`, or `utils`.
- **Rationale:** Tool and phase names become wrong; concept names stay
  meaningful. Catch-all names attract unrelated files.
- **Verification:** Review the top-level tree. Each folder name answers "what
  belongs here" without reference to a date or a vendor.

### P1-02-R6 — Document the layout at the root

- **Level:** MUST
- **Rule:** The root README or a linked page describes every top-level folder,
  what belongs in it, and where tests and documentation live.
- **Rationale:** An undocumented layout is rediscovered by every contributor and
  drifts as soon as the original author leaves.
- **Verification:** Compare the documented layout with the actual tree.

### P1-02-R7 — Add a top-level folder deliberately

- **Level:** MUST
- **Rule:** A new top-level folder states its owner and purpose in the layout
  documentation in the same change. Do not add a top-level folder for a single
  file, a single experiment, or a short-lived feature.
- **Rationale:** Top-level folders are the most expensive structure to change
  later because they appear in every path, script, and mental model.
- **Verification:** Review the change that introduces a folder. The documentation
  and ownership are updated together.

### P1-02-R8 — Mirror source structure in tests where practical

- **Level:** SHOULD
- **Rule:** Place a unit's tests so the mapping to the tested code is obvious,
  either beside the source file or in a test tree that mirrors the source tree.
  Do not scatter tests for one unit across unrelated folders.
- **Rationale:** A predictable mapping lets a reviewer find the evidence for a
  change and lets a future contributor extend it.
- **Verification:** Review test placement for a sample of recent changes.

## Examples

### Compliant: one home per artifact type

A repository keeps source under `src/`, tests beside the source file or in a
mirrored `tests/` tree, documentation under `docs/`, and build output in an
ignored `dist/`. The root README lists each folder and its owner.

### Compliant: a deliberate subproject

A workspace package with a different release cadence lives under `packages/`
with its own manifest rather than inside another package's source folder.

### Non-compliant: a nested project

A tool is copied into `src/vendor-tool/` with its own lockfile and build
scripts. The host repository now runs the tool's tests and inherits its
dependency tree without owning it.

### Non-compliant: two test roots

Tests live in `tests/`, `src/__tests__/`, and a per-feature `spec/` folder with
no documented rule. Contributors cannot tell where a new test belongs.

## Exceptions

Exceptions follow P1-14-R12. A repository migrated from another layout may keep
a legacy folder while the move is in progress. The exception names the rule,
folder, owner, and completion date.

## Verification

This standard is verified by review against the rules above. The repository gate
is:

```bash
pnpm check
```

The following checks are planned for P1-15 and are not implemented yet:

- root layout documentation matches the top-level tree;
- generated output is ignored;
- duplicate artifact roots are reported.

## Related decisions

- [P1-01: Architecture principles](architecture-principles.md)
- [P1-14: Engineering decisions](engineering-decisions.md)
- [Phase 1 specification](../../../architecture/specifications/phase-1.md)

## Change history

| Version | Date       | Change                         |
| ------- | ---------- | ------------------------------ |
| 0.1.0   | 2026-11-07 | Initial draft.                 |
| 0.1.0   | 2026-11-07 | Accepted by the project owner. |

## Approval record

| Version | Status   | Approver           | Date       |
| ------- | -------- | ------------------ | ---------- |
| 0.1.0   | Accepted | VAHU project owner | 2026-11-07 |
