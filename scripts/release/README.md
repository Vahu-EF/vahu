# Release scripts

- `validate-artifacts.ts` — command-line entry point. Packs the approved packages
  and inspects the resulting tarballs.
- `artifacts.ts` — the checks themselves: package set, manifest, required and
  forbidden contents, dependency ranges, and checksum rendering.
- `tar.ts` — a minimal ustar reader, so archives are inspected without adding a
  dependency or shelling out to a platform `tar`.
- `artifacts.test.ts` — builds synthetic tarballs and asserts each rule fails when
  it should.

```bash
pnpm build
pnpm release:pack                # pack into artifacts/ and verify
pnpm release:validate            # re-verify an existing artifacts/ directory
pnpm exec vitest run scripts/release/artifacts.test.ts
```

The scripts do not publish npm packages, create GitHub Releases, or produce
standalone executables. See [the release preparation guide](../../docs/contributing/release-preparation.md)
and [the Phase 8 specification](../../architecture/specifications/phase-8.md).
