# Framework content model

- **Content ID:** FRAMEWORK-CONTENT-MODEL
- **Status:** draft
- **Owner:** VAHU maintainers
- **Version:** 0.1.0
- **Content type:** guide
- **Lifecycle stages:** planning, design, implementation
- **Project types:** all
- **Depends on:** P1-14
- **Tags:** content-model, metadata, composition

## Purpose

Describe how framework content is identified, discovered, selected, and
validated. This is the contract behind `pnpm validate:standards` and the
`@vahu-ef/core` content functions.

## Why a content model

Framework content must be usable without the CLI, selectable per project, and
checkable by a machine. That needs three things: a stable identity for every
item, a declared applicability, and a deterministic way to combine items when a
project uses more than one source.

The content model extends the P1-14 standard-page format. It does not replace
it: standard pages keep `Standard ID`, `Status`, `Version`, and `Owner`, and the
content model reads those values rather than restating them.

## Discovery

Content lives under `packages/framework/`. Every Markdown file is classified by
name before it is read:

| File pattern    | Treatment                                                    |
| --------------- | ------------------------------------------------------------ |
| `README.md`     | Index page. Navigation only; not a content item.             |
| `*_TEMPLATE.md` | Authoring template. Not a published item.                    |
| Any other `.md` | Content page. Must declare the metadata in the next section. |

A content page that does not declare an identifier or the required fields fails
validation. Discovery is deterministic: files are visited in sorted path order.

## Metadata

A standard page already declares its identifier, status, version, and owner. A
non-standard content page declares `Content ID`, `Status`, `Owner`, and
`Version` itself. Both kinds add five content fields:

```markdown
- **Content type:** standard
- **Lifecycle stages:** implementation, review
- **Project types:** all
- **Depends on:** P1-01, P1-14
- **Tags:** quality, maintainability
```

| Field              | Required        | Values                                                                        |
| ------------------ | --------------- | ----------------------------------------------------------------------------- |
| `Content type`     | Yes             | `standard`, `practice`, `guide`, `workflow`, `profile`, `template`, `adapter` |
| `Lifecycle stages` | Yes             | `planning`, `design`, `implementation`, `review`, `release`, `operations`     |
| `Project types`    | Yes             | `all`, or any project type from the configuration schema                      |
| `Depends on`       | Yes             | Content IDs, or `None`                                                        |
| `Tags`             | Yes             | Short free-form labels, or `None`                                             |
| `Deprecation`      | When deprecated | The replacement ID or removal date                                            |

`Project types` uses the same values as `.vahu/project.json`, so a project
selects content from its own configuration without a mapping table.

### Derived fields

Some fields are derived, never declared twice:

| Content field | Source                                                                  |
| ------------- | ----------------------------------------------------------------------- |
| `id`          | `Standard ID`, otherwise `Content ID`                                   |
| `title`       | The level-one heading, with a leading `P1-03 —` prefix removed          |
| `description` | First paragraph under `Purpose`, otherwise after the title              |
| `status`      | The page status, mapped below                                           |
| `origin`      | The content type: `practice`, `profile`, `adapter`, otherwise `core`    |
| `enforcement` | For standards, from the strongest rule level; otherwise by content type |

### Status mapping

Standard pages use the P1-14 lifecycle; the content model uses four values:

| Page status  | Content status |
| ------------ | -------------- |
| `Draft`      | `draft`        |
| `Accepted`   | `stable`       |
| `Superseded` | `deprecated`   |
| `Retired`    | `deprecated`   |

Non-standard pages declare `draft`, `experimental`, `stable`, or `deprecated`
directly. Deprecated content must name its replacement or removal date in a
`Deprecation` field, so a reader is never left with a dead item and no path
forward.

### Enforcement

Enforcement decides what a project override may change:

| Enforcement   | Derived from                                                                             |
| ------------- | ---------------------------------------------------------------------------------------- |
| `mandatory`   | A standard with at least one `MUST` or `MUST NOT` rule                                   |
| `recommended` | A standard with only `SHOULD`/`SHOULD NOT`, or a practice, workflow, profile, or adapter |
| `optional`    | A guide or template, or a standard with only `MAY` rules                                 |

Enforcement is derived from the content, so it cannot drift from the rules the
page actually states.

## Dependency graph

`Depends on` records real prerequisites, not related reading. Dependencies must
resolve to a discovered item and must not form a cycle. The validator reports
`CONTENT_DEPENDENCY_UNKNOWN` for a missing target and
`CONTENT_DEPENDENCY_CYCLE` for a loop.

A cycle is an error because content selection must be order-independent: two
items that require each other cannot be applied in a defined order.

## Composition

A project combines four sources: mandatory core standards, optional practices,
technology profiles, and agent adapters, plus its own overrides. Precedence is
fixed:

| Rank | Source                             | Precedence value |
| ---- | ---------------------------------- | ---------------- |
| 1    | Mandatory item                     | 0                |
| 2    | Explicit project override (enable) | 1                |
| 3    | Selected profile                   | 2                |
| 4    | Practice                           | 3                |
| 5    | Recommended core item              | 4                |
| 6    | Optional item                      | 5                |

Rules:

1. An item applies when its `Project types` include `all` or the project type,
   and its lifecycle stages intersect the requested stages when stages are
   given.
2. A mandatory item cannot be disabled. An override that tries is reported as
   `COMPOSITION_MANDATORY_OVERRIDE` and the item remains selected. A project may
   specialize mandatory guidance, but it may not silently drop a security or
   safety requirement.
3. A recommended or optional item can be disabled by an override.
4. An override can enable an item outside its declared scope; it then takes the
   project-override rank.
5. An override for an unknown ID is reported as `COMPOSITION_UNKNOWN_ID`.
6. Output is deterministic: precedence, then content ID.

## Example

A complete page header:

```markdown
# P1-90 — Example standard

- **Standard ID:** P1-90
- **Status:** Draft
- **Owner:** Example maintainers
- **Approver:** VAHU project owner
- **Approval:** Pending
- **Version:** 0.1.0
- **Applies to:** Example projects
- **Content type:** standard
- **Lifecycle stages:** implementation, review
- **Project types:** all
- **Depends on:** P1-14
- **Tags:** example
- **Related:** None
```

It normalizes to `id: P1-90`, `status: draft`, `origin: core`, and
`enforcement: mandatory` once a rule in the page is `MUST`.

Composing for a `backend-service` project at the `implementation` stage returns
the applicable items ordered by precedence, mandatory first:

```text
P1-01@0, P1-02@0, P1-03@0, P1-05@0, … P1-09@4
```

An override that disables a mandatory item is refused: the item stays in the set
and `COMPOSITION_MANDATORY_OVERRIDE` is reported.

## Consuming content without the CLI

The framework is Markdown and JSON; nothing here requires the CLI.

- Read [the core standards index](core/README.md) for the standards.
- Read [`content.schema.json`](../schemas/content.schema.json) for the
  machine-readable metadata contract.
- Run `pnpm validate:standards` to verify the repository against this contract.
- Use `discoverContent`, `validateContentModel`, and `composeContent` from
  `@vahu-ef/core` when building a tool that needs the same rules.

## Adding content

1. Put a standard page under `core/` and follow P1-14; put other content in its
   own framework folder.
2. Add the five metadata fields. Do not restate identifier, status, version, or
   owner.
3. Reference real prerequisites in `Depends on`; do not create a cycle.
4. Run `pnpm validate:standards` and fix the reported codes.

## Validation codes

| Code                         | Meaning                                            |
| ---------------------------- | -------------------------------------------------- |
| `CONTENT_METADATA`           | A required field is missing or empty               |
| `CONTENT_ID`                 | The identifier is absent or malformed              |
| `CONTENT_ID_DUPLICATE`       | Two items use the same identifier                  |
| `CONTENT_TITLE`              | No level-one title                                 |
| `CONTENT_DESCRIPTION`        | No description or `Purpose` paragraph              |
| `CONTENT_TYPE`               | Unknown content type                               |
| `CONTENT_STATUS`             | Unknown status for the page kind                   |
| `CONTENT_VERSION`            | Version is not a semantic version                  |
| `CONTENT_PROJECT_TYPE`       | Unknown project type                               |
| `CONTENT_STAGE`              | Unknown lifecycle stage                            |
| `CONTENT_DEPENDENCY`         | A dependency is not a valid content identifier     |
| `CONTENT_DEPENDENCY_UNKNOWN` | A dependency does not resolve to a discovered item |
| `CONTENT_DEPENDENCY_CYCLE`   | Dependencies form a cycle                          |
| `CONTENT_DEPRECATION`        | Deprecated content does not name a replacement     |
| `LINK_UNRESOLVED`            | A relative link does not resolve                   |

## Discovery boundary

Only `packages/framework/` is a content root. The other trees are excluded on
purpose:

| Tree         | Why it is not a content root                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `templates/` | Files there are copied into user projects. Metadata in them would leak into generated files and become project content the user did not choose. |
| `docs/`      | Human-facing documentation about this repository, not reusable framework content.                                                               |
| `examples/`  | Sample projects, not framework items.                                                                                                           |
| `tests/`     | Test fixtures.                                                                                                                                  |

Adding a new content root is a contract change: it needs a stated reason, a
metadata rule for every file it will discover, and an update to
`validateContentModel` with tests.

## Limits

- Composition selects and orders items; it does not read project files or write
  configuration.
- The model describes content, not the rules inside a page. Rule structure is
  P1-15 page validation.
- Applicability is declared, not inferred from a project. A consumer supplies
  the project type and stages.
