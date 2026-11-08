# Project governance

This document describes project responsibilities and decision procedures. It
does not assign these roles to particular people or teams. The project owner
must publish the current role holders and any response-time commitments before
broad public participation or a release.

## Responsibilities

### Project owner

- Approves product scope and consequential architecture, security, legal, and
  compatibility decisions.
- Approves phase scope and reviews phase-completion evidence.
- Names release approvers and authorizes each public release separately.
- Resolves disagreements that cannot be settled by the relevant maintainers.

### Maintainers

- Review contributions for correctness, tests, security, documentation, and
  consistency with accepted decisions.
- Keep phase status and public capability claims aligned with verified behavior.
- Triage issues, request missing reproduction details, and close duplicates or
  out-of-scope reports with an explanation.
- Maintain the development and security policies; do not approve their own
  consequential product decisions in place of the project owner.

### Release owner

- Prepares a release against a named, tested commit and verifies package contents,
  checksums, versioning, and release notes.
- Confirms that required approvals and credentials/configuration exist before
  operating a publication workflow.
- Records the released version and artifacts. Preparation or CI success is not
  release authorization.

### Security response role

- Receives and privately triages vulnerability reports, limits access to report
  details, coordinates a fix and disclosure plan with the reporter, and updates
  `SECURITY.md` when support status changes.
- Uses the private channel in [`SECURITY.md`](../../SECURITY.md); vulnerability
  reports must not be moved into public issues before coordinated disclosure.

## Decisions and review

- Small, reversible implementation details follow existing code and accepted
  standards and are explained in the pull request.
- Consequential or cross-cutting decisions use an ADR. Record context,
  alternatives, decision, consequences, owner, and approval; do not record an
  approval on another person's behalf.
- Product scope, public compatibility promises, security-sensitive permissions,
  legal notices, and release/publication decisions require explicit project-owner
  approval.
- Contributions use pull requests and the checks in
  [`CONTRIBUTING.md`](../../CONTRIBUTING.md). Reviewers identify blocking issues
  separately from follow-up suggestions. A passing CI run is evidence, not
  approval of product direction.

## Issue triage

1. Keep suspected vulnerabilities private according to `SECURITY.md`; use public
   issues for other reports.
2. Label or classify reports by defect, feature request, documentation, security,
   or question when repository permissions support labels.
3. Ask for the smallest reproduction, expected behavior, actual behavior, and
   environment details needed to verify a defect. Do not request secrets or
   personal data.
4. Check for duplicates and existing roadmap/phase scope. Link the canonical
   issue or specification instead of creating a second source of truth.
5. Record the disposition: accepted, needs information, deferred, duplicate, or
   declined, with a concise reason. Scope changes still need owner approval.
6. Close stale reports only after a reasonable request for missing information
   and a final notice. No response-time service level is promised.

## Releases

- The project remains pre-release until a release is explicitly approved and
  published.
- The release owner checks the candidate from the exact source revision that
  passed the required validation, reviews package contents and checksums, and
  confirms compatibility notes and migration guidance.
- The project owner approves the version and publication targets before any
  registry publish, public GitHub Release/tag, signing, or binary distribution.
- Credentials use the configured secret store or trusted publishing; never put
  token values in issues, pull requests, logs, or repository files.
- If validation, provenance, ownership, or approval is unclear, stop and defer
  publication. See [`release-preparation.md`](release-preparation.md).

## Security response

Follow [`SECURITY.md`](../../SECURITY.md) for the private report channel and
current supported versions. A responder should acknowledge privately as soon as
practical, assess impact and affected versions, agree on disclosure timing with
the reporter, coordinate a tested fix, and publish an advisory after mitigation
is available. Do not promise a fixed response or disclosure deadline until the
project owner publishes a staffed contact and service commitment.

## Current assignments

No named maintainer, triager, release owner, or security responder is assigned by
this policy. The owner should add real GitHub handles/teams and confirm access to
the private reporting channel before enabling required CODEOWNERS review or
announcing response-time guarantees. See [CODEOWNERS](../../.github/CODEOWNERS).
