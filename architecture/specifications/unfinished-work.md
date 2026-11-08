# VAHU roadmap — unfinished work register

**Status checked:** 2026-11-08
**Purpose:** Consolidate the gaps recorded in the phase specifications. This is a
tracking index, not a claim that the roadmap is complete. The phase specifications
remain the detailed source of truth; this register should be updated when those
specifications change.

## Phase 1 — Content model and standards

- Extend structured content metadata discovery beyond `packages/framework/`
  without duplicating the existing validator. Link validation now scans repository Markdown files across the repository; it does not yet apply the metadata
  contract to those files.
- Apply content composition to an actual project configuration; document and test
  precedence and mandatory safety requirements end to end.
- Close the requirements/scope and change-management coverage gaps identified in
  the standards. Implement additional per-standard verification only where a
  check is stable and testable.

See [`phase-1.md`](phase-1.md) and
[`packages/framework/CONTENT_MODEL.md`](../../packages/framework/CONTENT_MODEL.md).

## Phase 2 — Project onboarding

- Design-system analysis: inspect supplied tokens/components, identify gaps and
  platform mappings, and preserve source decisions.
- Reviewable design-system proposals. A proposal must remain unapproved until a
  person explicitly approves it; do not invent brand assets or claims.
- Validate onboarding technology selections against Phase 4 profiles.
- Decide whether detected engineering-foundation facts need a versioned schema
  and persistence; currently `vahu foundation` reports detected facts only.

Repository-location ownership capture was implemented in this increment through
`vahu repositories --owner name=owner`; see [`phase-2.md`](phase-2.md).

## Phase 3 — Agent adapters and safe synchronization

- Implement and verify Codex, Claude Code, and Gemini CLI adapters, each with
  capability mapping, documented limitations/version assumptions, and output
  fixtures.
- Add merge-aware updates that preserve manual edits inside VAHU-marked output
  and report content conflicts. Current generic `agents sync` previews the full
  output, requires `--write`, and replaces marked files as a whole; it protects
  unmarked targets and symlinks but does not merge user content.

## Phase 4 — Technology profiles

- Add maintained profiles for the missing frontend/web, mobile, infrastructure/
  DevOps, and API families; only add technology-specific profiles with verified
  guidance and explicit supported versions.
- Store selected profile IDs/provenance in project configuration; current
  `vahu profile add/remove` commands update technology values only.
- Compose profile content into framework/agent output, with provenance and
  conflict handling. The current evaluator/catalog gate does not do this.

## Phase 5 — Workflows and quality gates

- Decide and implement a safe, explicit workflow/gate command runner; current
  definitions are validated and evaluated from caller-supplied results but do
  not execute commands.
- Ensure profile-aware execution, clear failure/recovery reporting, and human
  approval checkpoints before consequential actions.
- Define how evidence is independently verified or attest that caller-supplied
  evidence is not independently attested; never report an unrun command as
  passed.

## Phase 6 — CLI productization

- Extend `project configure` beyond Project Identity to a coherent project/stage
  configuration interface; implement design inspect and proposal flow; agent
  configuration plus provider-specific/merge-aware sync; quality check; and
  framework update. Project identity
  configure, the standalone `version` command, agent list/inspect and
  preview-first generic sync, preview-first profile technology add/remove, and
  `docs validate` have shipped; framework metadata validation across external
  trees remains separate work.
- Add accurate dry-run/diff behavior to file-changing operations and broaden
  integration coverage for command help, JSON contracts, failures, idempotency,
  and safe writes.
- Run the configured Ubuntu/macOS/Windows and Node 22/24 CI matrix and repair
  failures; this local workspace only verifies Ubuntu/Node 24. Verify installation
  and use from a clean external project after a package is publishable.
- Keep `phase-6.md`, CLI docs, and help output synchronized with shipped
  commands. `docs validate` is implemented and included in `pnpm check`; remaining
  command groups are listed above. Project configure currently covers Project
  Identity fields only; agent sync supports only the generic adapter and replaces
  VAHU-marked output wholesale. Profile
  add/remove is a technology-value mutation only;
  profile IDs and composition remain Phase 4 work.

## Phase 7 — Documentation, website, and examples

- Build the complete documentation/reference/search experience; Markdown remains
  canonical and no documentation engine/search is implemented.
- Add runnable application examples and missing project variants, including
  multi-agent only after adapters exist; validate all examples in CI.
- Perform a formal accessibility/WCAG review, browser/platform checks, and visual
  regression where appropriate; current semantic, keyboard, and responsive checks
  are not a certification.
- Publish GitHub Pages only after an explicit publication request/approval, then
  verify the real published site. The repository has not claimed a public deploy.

## Phase 8 — Release, distribution, compatibility

- Resolve the schema declaration output's nondeterministic ordering and verify
  reproducible rebuilds, not just deterministic repacking.
- Test older configuration compatibility/migrations and package installation in
  clean environments across supported operating systems.
- Implement standalone executable build/test matrix, checksums, and signing only
  after supported targets and security details are decided.
- Add release-note/tag/GitHub Release and npm publication workflows with
  least-privilege provenance/trusted publishing where configured.
- **External approval gate:** npm publication, GitHub Releases/tags, signing and
  binary publication are not performed by this register. They need explicit
  release authorization and the release credentials/identity configuration.

## Phase 9 — Hardening and community readiness

- Run a dependency/supply-chain audit when the configured registry/audit endpoint
  is available; `pnpm audit` was previously blocked by the mirror.
- Run the configured Ubuntu/macOS/Windows and Node 22/24 hosted CI matrix and
  repair failures; this local workspace has only run on Ubuntu/Node 24.
- Add additional schema migration tests, large-repo
  performance baselines, broad command idempotency checks, and interrupted-write
  recovery testing.
- If archive/template extraction is introduced, implement and test traversal and
  symlink defenses before enabling it; there is no extraction implementation now.
- Decide whether concurrent-writer locking and directory `fsync` durability are
  required and implement/document the chosen guarantees.
- Governance responsibilities and procedures now exist in
  `docs/contributing/governance.md`; still assign actual maintainer/triager/
  release/security-response roles and verify private reporting access before
  publishing contacts or response-time commitments.
- Conduct a usability study with developers unfamiliar with VAHU and address
  evidence-backed findings; this requires participant input and cannot be
  completed by code changes alone.
- Itemize public core exports and back compatibility claims with explicit tests.

## Cross-cutting completion criteria

- Docs-link validation checks 95 repository Markdown files via `vahu docs
  validate`, `pnpm validate:docs`, and the full `pnpm check` gate. The CI matrix
  is configured but hosted macOS/Windows/Node 22 runs remain pending.
- Keep specs, README, website, CLI help, examples, and actual behavior consistent.
- Run relevant tests, formatting, type checks, and builds for each increment;
  report failures and unavailable checks rather than weakening them.
- Preserve phase approval boundaries and existing user-owned files.
- Do not mark a phase complete based only on green CI. A phase needs the evidence,
  human review, and any approval required by its acceptance criteria.
- Do not publish packages, create releases/tags, or deploy the website without
  separate explicit authorization, even when local release/deploy preparation
  is complete.
