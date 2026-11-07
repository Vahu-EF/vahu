# Versioning and compatibility

VAHU follows [Semantic Versioning](https://semver.org/) for its public packages
and for the CLI. This page records what counts as a compatible change and how a
project should upgrade. It describes intent for the pre-`1.0.0` line; no version
has been published yet.

## What is versioned

| Surface                    | Current version | Where it lives                            |
| -------------------------- | --------------- | ----------------------------------------- |
| CLI (`vahu`)               | `0.1.0`         | `apps/cli/package.json`                   |
| `@vahu-ef/core`            | `0.1.0`         | `packages/core/package.json`              |
| `@vahu-ef/schemas`         | `0.1.0`         | `packages/schemas/package.json`           |
| Project configuration      | `1.1.0`         | `packages/schemas/src/project.ts`         |
| JSON report contract       | `1.0.0`         | `contractVersion` in CLI JSON output      |
| Framework content metadata | draft           | `packages/framework/CONTENT_MODEL.md`     |
| Technology profiles        | `1.0.0` schema  | `packages/framework/technology-profiles/` |

Package versions are independent. They are released together from one tested
commit but may move by different amounts.

## Pre-1.0 releases

Before `1.0.0`, breaking changes may ship in a minor version. They still require
a deliberate version change, a changelog entry, and migration notes. A patch
version never contains a breaking change.

## Stable and experimental surfaces

- **Stable:** documented CLI commands, their documented exit codes, the
  `contractVersion` JSON shape for those commands, the project configuration
  schema, and the exported API of `@vahu-ef/core` and `@vahu-ef/schemas`.
- **Experimental:** the content metadata contract, the generic agent adapter
  output, profile guidance text, and any command documented as in progress.
  Experimental surfaces may change in a minor version with a changelog note.

An undocumented behavior is not a contract, even when a published package
happens to expose it.

## CLI compatibility

A breaking CLI change removes or renames a command, flag, or documented exit
status; changes the meaning of a documented flag; or stops a documented command
from reading a configuration it previously accepted.

Adding a command, flag, or JSON field is compatible. Consumers should ignore
unknown fields.

## JSON report contract

Machine-readable reports carry `contractVersion` and a command-specific
`reportType`. Adding fields is compatible within the same `contractVersion`.
Removing a field, changing its type, or changing its meaning requires a new
`contractVersion` and a documented migration.

## Configuration schema compatibility

The configuration schema version is independent of the CLI version.

- A new schema version may change validation.
- A configuration written by a newer schema cannot be read by an older CLI; it
  is rejected rather than partially interpreted.
- A configuration written by an older schema is read only through an explicit,
  documented migration. `1.0.0` is read through the in-memory migration and
  rewritten at `1.1.0` by `vahu migrate --write`.
- Dropping support for an older schema version is a breaking change and requires
  a release note that names the last CLI version that can still read it.

## Framework content, profiles, and adapters

- Framework content items keep stable identifiers. A renamed identifier is a
  breaking change for anything that references it.
- Technology profiles keep stable identifiers and publish a schema version. A
  profile may add guidance in a compatible release; removing guidance, changing
  a supported version range, or adding a prerequisite that invalidates an
  existing selection is breaking.
- Adapters must declare supported and unsupported concepts. An adapter that
  cannot express a concept reports it; silently dropping content is never
  compatible. No provider-specific adapter is implemented, and none is claimed.

## Node.js support

The CLI and packages require Node.js 22 or newer, declared as
`engines.node >= 22.0.0`. CI runs Node.js 24. Dropping a supported major version
is a breaking change and requires a release note; adding support for a newer
release is compatible.

## Deprecation

1. Mark the surface deprecated in its documentation and changelog.
2. Keep it working for at least one minor release.
3. Remove it only in a breaking release, with a migration note naming the
   replacement.

## Upgrade guidance

```bash
# After upgrading the CLI
vahu migrate            # preview a schema migration
vahu migrate --write    # apply it deliberately
vahu validate
```

Projects should re-run `vahu validate` after a CLI upgrade, because a new version
may add checks. An upgrade never rewrites project configuration on its own.

## Publication status

No package has been published. The verification path is documented in
[release preparation](release-preparation.md) and the compatibility claims above
apply to the first published version.
