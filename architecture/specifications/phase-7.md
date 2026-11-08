# Phase 7 specification — Documentation, Website & Examples

- **Status:** In Progress — first public-site/docs/examples milestone implemented
- **Owner approval:** This Phase 7 first milestone and spec approved by the VAHU project owner on 2026-11-07
- **Decision:** [ADR-0012](../decisions/ADR-0012-static-website-and-canonical-markdown-documentation.md), accepted 2026-11-07
- **Canonical for:** Phase 7 public-facing content status

## Goal

Make the current VAHU repository understandable to a new developer without
private project context, using a clear public overview, an accurate local quick
start, maintained command/profile references, and tested project configuration
examples.

## Approved first milestone

The approved scope is to build on existing assets, not to replace the website
stack or duplicate the detailed documentation. The static site links to canonical
Markdown docs in the repository. This increment does not publish Pages.

### Website

The existing dependency-free static GitHub Pages app now includes:

- a clear value proposition and current project status;
- implemented standards, project context, technology profile, and workflow/gate
  summaries with links to canonical sources;
- an honest agent-support table (generic renderer implemented; provider adapters
  not implemented);
- a clone-based quick start matching the actual CLI;
- links to getting-started, CLI, examples, standards, configuration, roadmap,
  contribution, and security pages;
- semantic landmarks, labeled navigation, keyboard skip link and focus styles,
  responsive breakpoints, and reduced-motion handling.

The page explicitly states that npm and GitHub Pages publication are not
verified/published. The site's built `dist/index.html` is checked for updated
content by a test; the normal website build remains deterministic.

### Documentation and examples

- CLI docs describe read-only project reports, versioned JSON contracts, and
  preview-first profile technology add/remove; they distinguish technology
  selection from profile-ID persistence and content composition.
- Getting-started, framework-status, technology-profile, docs-index, and examples
  pages reflect the current repository rather than Phase 0-only planned status.
- The five committed `.vahu/project.json` examples are validated by the CLI
  integration suite via the real `vahu validate` command.
- No multi-agent example is claimed: provider-specific adapters are not
  implemented.

## Validation

```bash
pnpm --filter @vahu-ef/website build
pnpm exec vitest run apps/website/tests/site.test.ts
pnpm exec vitest run apps/cli/tests/cli.test.ts -t 'every committed example'
pnpm check
```

The website test checks current status/capability text, links to existing
canonical files, consistency of linked CLI/profile/example docs, semantic
sections, focus/responsive source rules, and the built Pages artifact. Example
tests invoke the CLI validator for every example folder containing
`.vahu/project.json`.

## Acceptance state

| Criterion                                                | State   | Evidence                                                                       |
| -------------------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| New user can understand the purpose and local start path | Partial | Homepage and getting-started page; no published site claimed                   |
| Documentation matches implemented behavior               | Partial | CLI/profile/examples/docs updated and regression-checked                       |
| Examples pass automated validation                       | Met     | All five project configs validated through CLI test                            |
| Website is responsive and accessible                     | Partial | Semantic/keyboard/reduced-motion checks and responsive CSS; no full WCAG audit |
| GitHub Pages build is reproducible                       | Met     | Dependency-free build plus built-content test                                  |
| GitHub Pages is deployed                                 | Not met | Not requested or performed                                                     |
| Complete documentation site/search/reference             | Not met | Markdown remains canonical; not rendered into a docs engine                    |

## Out of scope and limitations

This milestone does not add a site generator, client-side JavaScript, search,
localized docs, runnable application examples, formal WCAG certification,
automated visual regression, cross-platform browser tests, or GitHub Pages
publication. Profile and provider support claims remain limited to the
implementations explicitly identified in the linked specs.
