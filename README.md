# dirt.incantationjunction.com

Corporate site for **SipsCo** — premium dirt, engineered to grow. A marketing
homepage, a news log at `/news/`, and an R&D section whose field report on
Unit 7 is checked against real source on every CI run.

Built with [Astro](https://astro.build), deployed to GitHub Pages via GitHub
Actions, and served at <https://dirt.incantationjunction.com>.

## Local development

```sh
npm install
npm run dev         # local dev server
npm run check       # astro check (types + templates)
npm run check:drift # field report vs the real Lua (see below)
npm run build       # static build into dist/
npm run preview     # serve the built output
```

The Node version lives in `.nvmrc` and both workflows read it from there, so
there is one number to change rather than three.

## Content

All page copy is placeholder/demo content. The parts most likely to change:

| What | Where |
| --- | --- |
| Services cards | `services` array in `src/pages/index.astro` |
| Stat figures | `stats` array in `src/pages/index.astro` |
| News items | `news` array in `src/data/news.js` |
| Section prose, footer, contact | markup in `src/pages/index.astro` |
| Title, description, favicon, colour tokens | `src/layouts/Base.astro` |
| Unit 7 appendix, test names, code listing | `src/data/unit-7.js` |

The R&D page's first two programme cards describe real published programs and
must stay true of them; Blend Formulation is openly invented.

## The newsroom

News lives in `src/data/news.js`, newest entry first, and two pages render the
same array: the homepage shows `HOMEPAGE_NEWS_COUNT` of them as a teaser and
`/news/` shows all of them with no pagination, so the log can grow without the
homepage changing shape.

Nothing in the data says which entry is the lead. The homepage takes the first
one, which means adding a newer entry at the top of the array promotes it --
full width, photo beside the copy -- and demotes the previous lead, with no
flag to remember to move. The homepage shows a photo on the lead entry only;
`/news/` shows every photo it finds, so a photo does not disappear from the
site when its entry ages out of the teaser.

An entry with a photo carries its own `imageWidth` and `imageHeight`. Those
are per-entry rather than fixed in the template because the screenshots are
not all the same shape, and one hard-coded pair in the markup would hand the
browser the wrong aspect ratio for every photo but one.

## The Unit 7 field report

`/rnd/unit-7/` is a document rather than a marketing page. The company around
it is fictional and the engineering is not: every figure in Appendix A is a
real constant, every name in section 7 is a real test, and Listing 1 is real
source — all of it from
[erinlkolp/computercraft-scripts](https://github.com/erinlkolp/computercraft-scripts).

Nothing in this repository can notice when that one moves, so
`tools/check-source-drift.mjs` reads the Lua and compares it against
`src/data/unit-7.js`, the same module the page renders from. It checks 19
claims: the appendix constants (digit-boundary matched, so `3` cannot satisfy
a row that says `32`), the accepted-fuel list as a set in both directions, all
25 test names verbatim and in source order, and the six lines of Listing 1.

```sh
npm run check:drift                          # expects ../computercraft-scripts
npm run check:drift -- /path/to/the/scripts  # or say where it is
```

Exit codes are `0` clean, `1` drift, `2` could not find the scripts.

CI runs it against that repository's **default branch**, on purpose: changing a
constant over there turns this build red without anyone touching this
repository. That is the intended coupling — the report claims to be true, so
the build should fail when it stops being. It runs in `ci.yml` only, never in
`deploy.yml`, so drift never blocks publishing the site.

Figure 1 on that page is generated from the same loop shape as `buildPath()`
in `flattener.lua` rather than drawn by hand, so the drawing cannot disagree
with the algorithm it illustrates.

The footer copyright year is rendered at build time, so it updates whenever
the site is rebuilt.

## Photography

The photographs are Minecraft screenshots, which is what the footer disclaimer
covers. Anything added here has to stay one.

Screenshots arrive as PNG and are published as WebP at their source
dimensions. Crop before converting: nothing in the repo resizes them, and the
file's own size is what the page declares to the browser. The alpha channel is
dropped, and the assertion below fails rather than quietly flattening a real
transparency -- a screenshot is opaque, so a transparent one is a sign the
file is not what it is assumed to be.

```sh
python3 - <<'PY'
from PIL import Image
im = Image.open("/path/to/shot.png")
if im.mode == "RGBA":
    assert im.getchannel("A").getextrema()[0] == 255, "real transparency"
im.convert("RGB").save("public/img/<name>.webp", quality=82, method=6)
print(Image.open("public/img/<name>.webp").size)
PY
```

Quality 82 lands near 40 dB PSNR on this material and sizes in with the photos
already here. Two things follow every conversion: the dimensions the command
prints go into the entry in `src/data/news.js` as `imageWidth` and
`imageHeight`, and a `test -f dist/img/<name>.webp` line joins the others in
the assert step in `ci.yml`, so a photo that stops reaching `dist/` turns the
build red instead of 404ing in public.

## Block artwork

The isometric blocks in `public/img/` are original pixel art, generated by
`tools/generate-blocks.py`. No third-party game textures are used or copied —
the palettes, noise, and geometry are all defined in that script, which is
seeded and therefore reproducible:

```sh
python3 tools/generate-blocks.py   # run from the repo root
```

Blocks are composed on a 2:1 isometric lattice where the only legal neighbour
moves are `(±S·k, ±S/2·k)`; placing blocks off-lattice makes them touch at a
point and appear to float. `sand-block.svg` is an unused spare variant.

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
