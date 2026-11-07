# ADR-0014: Write the project configuration atomically and never through a symlink

- **Status:** Accepted
- **Date:** 2026-11-07
- **Owner:** VAHU maintainers
- **Approver:** VAHU project owner
- **Supersedes:** None
- **Superseded by:** None

## Context

`saveProjectConfig` wrote directly onto `<project>/.vahu/project.json`. Phase 9
requires recovery from interrupted operations and path-traversal protection, and
a review of that write found two real defects:

1. An interrupted write (crash, full disk, killed process) could leave a
   truncated file, destroying the only copy of a project's configuration. The
   file is often the result of several interactive approval steps.
2. `writeFile` follows a symlink. A repository that commits
   `.vahu/project.json` as a link to a file outside the project could cause the
   CLI to overwrite that outside file with generated content.

Two tests written before the change reproduced both: the file kept its inode
(proof of in-place rewriting), and the outside file was overwritten through the
link.

## Decision

- Write the configuration to a uniquely named temporary file in the same
  directory, then `rename` it onto the target path.
- Create the temporary file with an exclusive-create flag and a normal file mode,
  so a stale or planted temporary file is never reused.
- Remove the temporary file when the write or the rename fails, and rethrow so
  the caller still reports the failure.
- Keep the existing safety rule unchanged: an existing configuration is replaced
  only when `overwrite` is explicit.
- Record the behavior and the remaining gaps (no locking, no directory `fsync`)
  in the [threat model](../../docs/security/threat-model.md).

## Consequences

Positive:

- A reader sees either the previous configuration or the complete new one.
- A symlink at the configuration path is replaced instead of followed, so a
  committed link cannot redirect a write outside the project.
- Failed writes leave no debris in `.vahu/`.
- The behavior is covered by four tests, two of which failed before the change.

Negative and open:

- Concurrent processes are not coordinated; the last complete rename wins.
- The directory is not `fsync`ed, so a power loss can still lose the most recent
  write on some filesystems.
- Temporary files briefly exist in `.vahu/`. A crash between the write and the
  rename can leave a `.project.json.<uuid>.tmp` file behind. It is inert, is
  never read by any command, and is not matched by `.gitignore`.
- Filesystems without stable inode numbers cannot express the replacement test,
  which skips there.

## Alternatives considered

- **Write to a temporary directory and rename.** Rejected: `rename` is only
  atomic within a filesystem, and a temporary directory may be on another one.
- **Keep the direct write and document the risk.** Rejected: the symlink case is
  a silent write outside the project, which no documentation makes acceptable.
- **Use `realpath` and reject symlinked configuration paths.** Rejected as the
  primary fix: refusing to write would block legitimate repositories, while
  replacing the link keeps the write inside the project and preserves the user's
  ability to run the CLI. A warned refusal can be added later if that is
  preferred.
- **Add a file-locking dependency.** Rejected for now: VAHU has no concurrent
  writer today, and the atomic rename already prevents corruption.

## Links

- Related ADRs: [ADR-0007](ADR-0007-project-identity-schema-1-1-0.md),
  [ADR-0011](ADR-0011-cli-read-only-reports.md),
  [ADR-0013](ADR-0013-verified-release-candidates.md)
- Affected files or packages: `packages/core/src/config.ts`,
  `packages/core/src/config.test.ts`
- Related specification: [`phase-9.md`](../specifications/phase-9.md)

## Approval

- **Approved by:** VAHU project owner
- **Approved on:** 2026-11-07
- **Review date:** None

## Notes

Implementation record: atomic write through a temporary file plus rename, temp
cleanup on failure, four configuration-write tests, and the threat model that
records the residual risks.
