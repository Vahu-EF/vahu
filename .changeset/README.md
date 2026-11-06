# Changesets

This folder prepares semantic versioning for future VAHU releases. It is not an
active publishing pipeline in Phase 0.

When a change should affect a published package, add a changeset:

```bash
pnpm changeset
```

Choose the package and the correct SemVer bump, then describe the user-visible
change. Commit the generated Markdown file with the code.

Do not add a changeset that implies a package has been published. No npm package
or GitHub Release exists during Phase 0.
