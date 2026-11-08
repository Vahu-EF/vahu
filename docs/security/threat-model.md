# Threat model: local file operations and generated instructions

This document covers the security-relevant behavior of the VAHU CLI, the
framework content it reads, and the instructions it can render for AI agents. It
describes the code as it exists on `main`; anything listed as unimplemented has
no attack surface here because the code does not exist.

## Scope and assets

In scope:

- the `vahu` CLI and the `@vahu-ef/core` / `@vahu-ef/schemas` packages;
- the project configuration at `<project>/.vahu/project.json`;
- framework content under `packages/framework/` and the bundled profile catalog;
- instruction files rendered from canonical agent definitions.

Assets worth protecting:

- the user's source tree and any unrelated file on their machine;
- the integrity of an existing project configuration;
- secrets in the environment, `.env` files, and CI configuration;
- the developer or CI machine, which is trusted but not privileged by VAHU.

Out of scope: a hosted service, accounts, a database, and remote content sync.
The project has none of these, so there is no server-side trust boundary.

## Trust boundaries

| Input                                | Trust                  | Handling                                                           |
| ------------------------------------ | ---------------------- | ------------------------------------------------------------------ |
| CLI arguments (`--path`, …)          | User                   | Resolved with `node:path`; the user names a directory deliberately |
| Existing `.vahu/project.json`        | Untrusted              | Parsed as JSON, then validated and migrated by a schema            |
| `package.json`, docs, workflow names | Untrusted              | Read for a bounded set of facts; malformed content is ignored      |
| Profile catalog JSON                 | Untrusted              | Schema-validated; invalid files are reported, never applied        |
| Canonical agent definitions          | Untrusted              | Rendered as data; never executed                                   |
| Rendered instruction files           | Untrusted to the agent | Carry an origin header and no secret values                        |

## Threats and mitigations

### 1. Path traversal outside the project

The only path the CLI derives on its own is
`resolve(cwd, '.vahu/project.json')`. The relative part is a constant, so a user
supplied directory cannot redirect the write elsewhere within that directory.
Passing a directory such as `/` writes `/.../.vahu/project.json`, which is the
directory the user named — user intent, not traversal.

Covered by `packages/core/src/config.test.ts` ("keeps the configuration inside the
resolved project directory").

### 2. Symlink planted at the configuration path

A repository can commit a symlink at `.vahu/project.json` pointing at a file
outside the project. Writing through it would modify that file with attacker
chosen content. The configuration is written to a temporary file and then
renamed, and `rename` replaces the link itself rather than following it.

Covered by "replaces a symlink at the configuration path instead of writing
through it". This test failed before the fix, so the regression is real rather
than hypothetical.

### 3. Interrupted or partial writes

A direct write can be truncated by a crash, a full disk, or a killed process,
destroying the only copy of the configuration. The write now lands in a
temporary file in the same directory and is renamed into place, so a reader sees
either the previous file or the complete new one.

Covered by "replaces the file atomically instead of rewriting it in place" and
"leaves no temporary files behind when the write fails".

### 4. Overwriting user data

`saveProjectConfig` refuses to replace an existing configuration unless
`overwrite` is explicit; `vahu init` asks before replacing and honors `--force`
only when given. `vahu agents sync` can also write `AGENTS.md` only with
`--write`; it rejects symlinks and targets without the VAHU generic-adapter
marker, and it replaces marked files wholesale. It does not generate source files,
rewrite `package.json`, or touch `.github/`.

### 5. Reading secrets

`vahu foundation` reports whether `.env.example` or `.env.sample` exists. It does
not read `.env` contents, and no command collects environment values into
configuration, output, or rendered instructions. Deterministic output was also a
design goal: adapter rendering includes no timestamps or environment values.

### 6. Generated instructions as untrusted content

Canonical definitions are data. Rendering emits provider-neutral Markdown with a
generated-by header; nothing in a definition is executed, and no tool permission
is granted automatically. A definition can still contain text that a model might
follow, so generated instructions are treated as repository content: a reviewer
reads the preview before using `--write` and before an agent consumes it. Generic
sync writes only the provider-neutral `AGENTS.md`; provider-specific adapters are
not implemented.

### 7. Command execution

The CLI does not run project scripts. `vahu doctor` probes `node --version` and
`git --version` with fixed names and a fixed argument; no user input reaches the
command line. On Windows the probe uses a shell because command shims require it,
which means a malicious `git` earlier on `PATH` would run — inherent to probing a
command by name, and bounded to a `--version` invocation.

### 8. Archive and template extraction

Not implemented. There is no extraction code, so there is no zip-slip surface
today. This is a required review item before any template or archive import
ships.

### 9. Dependency and supply chain

- GHSA-g3hv-75wg-m249: `minimatch` below 11.0.1 is a denial-of-service risk
  through glob-parts amplification. Removing ESLint and its TypeScript plugin
  removed `minimatch` from the current lockfile, so the temporary override is no
  longer needed. Recheck the resolved dependency tree when changing tooling.
- `pnpm audit` could not run here: the configured registry mirror has no audit
  endpoint. Advisory data therefore comes from GitHub's Dependabot alerts.
- CI pins workflow actions to major tags and uses read-only permissions for
  verification and release jobs. The release workflow publishes nothing.

## Residual risks

- No locking: two concurrent VAHU processes writing the same project would both
  succeed, and the last complete rename wins. No corruption, but no merge.
- Durability: the rename is atomic with respect to readers, but the directory is
  not explicitly `fsync`ed, so a power loss can still lose the most recent write
  on some filesystems.
- Cross-platform permission behavior is not verified beyond the platforms CI
  runs; the tests are written to skip checks a filesystem cannot express.
- `--path` on the profile catalog reads any `.json` files in a directory the user
  names. That is a deliberate feature, and the files are validated before use.
- A malicious definition can still contain persuasive text. VAHU provides
  provenance and reviewability, not content sanitization.

## Review triggers

Revisit this model when any of the following lands: template or archive
extraction, provider adapters that write files, a command runner for workflows, a
remote content sync, or a change to how configuration is written.
