# VAHU website

A dependency-free static overview prepared for GitHub Pages. It is separate
from the CLI runtime; canonical detailed documentation remains in Markdown
under `docs/`, `architecture/`, and `examples/`.

## Commands

```bash
pnpm --filter @vahu-ef/website dev
pnpm --filter @vahu-ef/website build
```

The build copies `src/` and `public/` into `dist/` and adds `.nojekyll`.

## Publication status

The site is **not published**. The Phase 7 first milestone updates the overview
and links to the maintained documentation; it does not publish Pages. To enable
it later:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Run the `Pages` workflow manually when the site is ready.

The intended default address is `https://vahu-ef.github.io/vahu/`. No custom
domain is assumed.
