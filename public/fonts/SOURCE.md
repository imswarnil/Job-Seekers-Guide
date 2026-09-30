# Where these fonts came from

## Geist and Geist Mono

Copied out of the Im Design System (`design.imswarnil.com`) rather than fetched
from a CDN or an npm package.

| | |
| --- | --- |
| Source | `design.imswarnil.com/assets/fonts/` |
| Commit | `aa7e9bd` |
| Copied | 2026-09-26 |
| Licence | SIL Open Font License 1.1 — the full text is in `OFL.txt` beside this file |

They are **vendored, not linked.** A relative path to a sibling folder works on
one machine and nowhere else, and this site is built in CI on a machine that has
never seen `design.imswarnil.com/`. The same reasoning is written out at length in
the umbrella `AUTHORING.md` under "How a theme consumes the design system"; this is
that pattern, applied to a Nuxt site instead of a Ghost theme.

To refresh them, copy the files again and update the commit above.

Geist Pixel (`GeistPixel-Square.woff2`) was removed on 2026-09-30: nothing had
loaded it since `.font-pixel` was repointed at Geist.

## Caveat

The handwriting behind `--font-hand` and `.handnote` (the margin notes on the
home page). One variable file per subset, covering weights 400-700, so the 400
and 600 the site uses both come from it.

| | |
| --- | --- |
| Source | Google Fonts, `https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap` (v23) |
| Files | `Caveat-Variable-latin.woff2`, `Caveat-Variable-latin-ext.woff2` |
| Downloaded | 2026-09-30 |
| Licence | SIL Open Font License 1.1 (OFL) — Copyright 2014 The Caveat Project Authors, https://github.com/googlefonts/caveat |

The latin-ext subset is vendored alongside latin for one glyph: the rupee sign
(U+20B9), which the hero's handwritten salary note cannot do without.

`@font-face` for everything here is in `app/assets/css/main.css`. Nothing else
reads this file — it exists so that in a year somebody can tell exactly which
version of each font shipped.
