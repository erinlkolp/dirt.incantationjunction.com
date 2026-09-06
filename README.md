# dirt.incantationjunction.com

One-page corporate site for **SipsCo** — premium dirt, engineered to grow.

Built with [Astro](https://astro.build), deployed to GitHub Pages via GitHub
Actions, and served at <https://dirt.incantationjunction.com>.

## Local development

```sh
npm install
npm run dev      # local dev server
npm run check    # astro check (types + templates)
npm run build    # static build into dist/
npm run preview  # serve the built output
```

## Content

All page copy is placeholder/demo content. The parts most likely to change:

| What | Where |
| --- | --- |
| Services cards | `services` array in `src/pages/index.astro` |
| Stat figures | `stats` array in `src/pages/index.astro` |
| Section prose, footer, contact | markup in `src/pages/index.astro` |
| Title, description, favicon, colour tokens | `src/layouts/Base.astro` |

The footer copyright year is rendered at build time, so it updates whenever
the site is rebuilt.

## Deployment

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
`.github/workflows/ci.yml` runs the same checks on pull requests, plus an
offline link check.

Two things are configuration rather than code:

- **Pages source must be "GitHub Actions"**, not "Deploy from a branch". On a
  branch source, Pages runs Jekyll over the repo and the build fails on
  `.astro` files.
- **`public/CNAME`** carries the custom domain into `dist/`. Actions-based
  deploys do not get a CNAME written for them the way branch deploys do, so
  removing that file will drop the custom domain on the next deploy.

DNS lives at the registrar: `dirt` resolves to the GitHub Pages addresses.
