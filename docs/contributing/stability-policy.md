# Stability and support policy

This page defines what "stable" means for each VAHU surface and what a maintainer
may change without a breaking release. It complements
[versioning and compatibility](../contributing/versioning-and-compatibility.md),
which defines the version rules; this page defines the expectation of support.

## Status labels

Every documented surface carries one of these labels:

| Label            | Promise                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| **Stable**       | Changes follow Semantic Versioning; removal needs a deprecation and a major |
| **Experimental** | May change in a minor release with a changelog note and migration guidance  |
| **Planned**      | Described only; no implementation and no support commitment                 |

A surface is **Stable** only when it is documented here, covered by a test that
exercises its failure cases, and listed in the specification of the phase that
implemented it. Anything else is experimental by default.

## Current classification

| Surface                                                   | Label        | Basis                                                              |
| --------------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| `vahu validate`, `init`, `identity`, `migrate`, `version` | Stable       | Documented, integration-tested, with refusal cases                 |
| `vahu doctor`, `readiness`, `foundation`                  | Stable       | Documented and integration-tested                                  |
| `project inspect/status`, `profile list/validate`         | Stable       | Versioned JSON reports with failure tests                          |
| `project configure`                                       | Experimental | Preview-first identity edit; failure and idempotency tests         |
| `agents list/inspect`                                     | Experimental | Versioned reports; bundled catalog and malformed-input tests       |
| `brand`, `design`, `technology`, `repositories`           | Stable       | Approval rules enforced and tested                                 |
| `docs validate`                                           | Experimental | Versioned link report; local links only, no remote URL checking    |
| Project configuration schema `1.1.0`                      | Stable       | Validated; `1.0.0` readable through a documented migration         |
| JSON report `contractVersion` `1.0.0`                     | Stable       | Additive changes only within the version                           |
| `@vahu-ef/core` exports                                   | Experimental | Documented at a high level; no per-export support matrix yet       |
| `@vahu-ef/schemas` exports                                | Stable       | Schemas are the configuration contract                             |
| Framework content metadata                                | Experimental | Draft contract in `CONTENT_MODEL.md`                               |
| Engineering standards (P1-01…P1-15)                       | Stable       | Accepted and binding; changes need an ADR                          |
| Technology profiles                                       | Experimental | Three profiles; guidance may still change                          |
| Generic agent adapter output                              | Experimental | Rendered format may change before a provider adapter exists        |
| Release candidates (`release:pack`)                       | Experimental | Structure is checked; byte-level reproducibility is not guaranteed |
| Website                                                   | Experimental | Static overview; not deployed                                      |
| Workflow/gate definitions                                 | Experimental | Contracts exist; no runner executes them                           |

## What "supported" means

- **Supported platform:** The CI matrix is configured for Ubuntu, macOS, and
  Windows on Node.js 22 and 24. Until each hosted matrix job has passed, only
  Ubuntu on the local Node.js 24 environment is verified by this workspace; do
  not treat configuration as completed platform evidence.
- **Supported Node.js:** 22 and newer, `engines.node >= 22.0.0`. CI runs Node.js 24. A defect on a supported version is a bug.
- **Support window:** `main` is the only supported line while the project is
  pre-`1.0.0`. No version has been published, so there is no maintenance window
  to honor yet. Once a version is published, the most recent minor line is
  supported with security fixes.

## Change rules

A maintainer may make these changes without a breaking release:

- add a command, flag, JSON field, standard, profile, or workflow;
- improve an error message, as long as the exit status meaning is unchanged;
- tighten validation that previously accepted an ambiguous configuration, only
  when the tightened rule is documented and a changelog note explains the
  migration;
- change **Experimental** surfaces, with a changelog note.

A maintainer must treat these as breaking:

- remove or rename a command, flag, exported symbol, or configuration field;
- change the meaning of a documented flag or exit status;
- change a `contractVersion` shape;
- raise the minimum Node.js version or drop a supported platform;
- change an accepted standard in a way that invalidates prior compliance claims.

## Evidence required before calling something stable

1. A specification records the intended behavior and its limits.
2. Tests cover the normal path, the refusal path, and at least one failure of the
   underlying operation.
3. Documentation states what the surface does **not** do.
4. No acceptance criterion is marked met on the strength of a manual check alone.

## Review

This policy is reviewed when a phase changes a surface's label, when a version is
published, and at the start of any phase that adds a filesystem-writing command.
