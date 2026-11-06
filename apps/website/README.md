# VAHU website

A small, dependency-free static site prepared for GitHub Pages. It is separate
from the CLI runtime and does not import any framework package.

## Commands

```bash
pnpm --filter @vahu-ef/website dev
pnpm --filter @vahu-ef/website build
```

The build copies `src/` and `public/` into `dist/` and adds `.nojekyll`.

## Publication status

The site is **not published**. To enable it later:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Run the `Pages` workflow manually when the site is ready.

The intended default address is `https://vahu-ef.github.io/vahu/`. No custom
domain is assumed.
