# ADR-0005: Use Apache License 2.0 without an unconfirmed copyright holder

- **Status:** Accepted
- **Date:** 2026-11-06

## Context

VAHU is intended to be open source. Apache License 2.0 is a permissive license
with an explicit patent grant and clear redistribution terms. The organization
has not supplied a confirmed legal entity, copyright owner, or registration
information.

## Decision

Add the standard Apache License 2.0 text to `LICENSE`. Do not add a separate
copyright line that asserts an unconfirmed legal entity. The organization name
`Vahu-EF` is a GitHub organization, not necessarily a legal person.

The project owners must confirm the copyright notice and any NOTICE file before
a public release. The license text alone grants the license; the copyright notice
is a separate ownership statement.

## Consequences

- The repository is prepared for Apache-2.0 distribution.
- No legal entity or year is fabricated.
- A release checklist item remains: confirm the copyright holder and add a
  NOTICE only if the owners decide it is required.
- This ADR is not legal advice.
