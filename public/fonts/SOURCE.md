# Where these fonts came from

Geist, Geist Mono and Geist Pixel, copied out of the Im Design System
(`design.imswarnil.com`) rather than fetched from a CDN or an npm package.

| | |
| --- | --- |
| Source | `design.imswarnil.com/assets/fonts/` |
| Commit | `aa7e9bd` |
| Copied | 2026-09-26 |
| Licence | SIL Open Font License 1.1 — the full text is in `OFL.txt` beside this file |

They are **vendored, not linked.** A relative path to a sibling folder works on
one machine and nowhere else, and this site is built in CI on a machine that has
never seen `design.imswarnil.com/`. The same reasoning is written out at length in
the umbrella `CLAUDE.md` under "How a theme consumes the design system"; this is
that pattern, applied to a Nuxt site instead of a Ghost theme.

To refresh them, copy the four files again and update the commit above. Nothing
else reads this file — it exists so that in a year somebody can tell exactly
which version of the system shipped.

`@font-face` for all three is in `app/assets/css/main.css`. Geist Pixel is only
ever applied by the `.font-pixel` class, which is used on stat numbers and
nowhere else.
