# Where this branch got to, and what is left

Branch: **`ai-era-curriculum`**. Every commit green on `pnpm lint`,
`pnpm check:lessons` and `pnpm build` (748 routes prerendered, no errors).

## Done

**The Im Design System is in.** `app/assets/css/main.css` maps this site's
Tailwind theme onto design.imswarnil.com's tokens: Geist, Geist Mono and Geist
Pixel vendored into `public/fonts/` with the source commit in
`public/fonts/SOURCE.md`, one accent instead of indigo-plus-teal, an achromatic
grey ramp, and the golden-ratio ladder exposed as Tailwind spacing. The previous
stack named Inter, Plus Jakarta Sans and JetBrains Mono and shipped none of them.

**The story is one page.** `content/6.story` (16 chapters), `content/5.series`
(10 episodes), the book reader, the CRT television and ~2,400 lines of component
are gone. `content/5.my-story.md` + `app/pages/my-story.vue` replace them:
fifteen `::story-chapter` bands with number, year, place and phase, four pull
quotes, the salary chart, and a rail that is a real timeline grouped into five
phases. Every old URL redirects, in all four mechanisms this repo uses.

**The header was never sticky.** `UHeader`'s own `sticky top-0` did nothing,
because its wrapper div in `AppHeader.vue` is exactly one header tall and a
sticky element cannot travel outside its containing block. Fixed.

**`pnpm check:lessons`** (`scripts/check-lessons.mjs`) walks every lesson and
reports two failures that render as a wall of raw YAML and fail nothing else: an
MDC block closed with ``` instead of `::`, and a nested component opened with too
few colons. It also reports em dashes, which CLAUDE.md bans.

**All 22 tracks have content.** English is new, at `content/1.path/01.english`,
and every track after it was renumbered (URL-safe: Nuxt Content strips the
numeric prefix). 174 lesson files, 143 lessons in the path, ~29 hours of reading.

| Track | State |
| --- | --- |
| orientation, english, terminal | Full: chapters, glossaries, interview Q&A, exercises |
| operating-systems, computer-networks, dbms, data-structures | Full |
| java, sql | Full, and the deepest — these are the two the course rests on |
| html, css, javascript | Two chapters each, worked projects |
| data-visualisation, toolchain, typescript, react, nextjs, nosql, supabase, hosting | One chapter each, the decision each track exists to teach |
| ai, interview | Full |

## What is left

1. **Bookends for the tracks written at one chapter.** The web and tooling
   tracks have their lessons and not their glossary, interview Q&A and exercises
   files. The pattern is in `06.data-structures` and `07.java`.
2. **More chapters for the web tracks.** Each currently teaches the decision
   that track exists for. `content-plan.md` Parts C lists the rest.
3. **The 210 em dashes** in lessons written before this branch, mostly the
   terminal track. `pnpm check:lessons` lists them. Fix by hand: a script makes
   the prose worse, which is why they were left.
4. **The University Management App itself.** Every track now references it and
   the build lessons are specified rather than written. `content-plan.md` §26 is
   the spec.

## Rules that were established while writing

- **The narrator journals** from the years he could not get a job. Every track
  has at least one named, specific failure with a number in it.
- **The university, always.** Applicant, Application, Programme, Department,
  Student, Faculty, Subject, ExamResult, Attendance, FeePayment.
- **Definition, then consequence.** Every interview answer in every track is one
  sentence of definition and two of what it causes. The consequence is the part
  that cannot be memorised from a list.
- **Every lesson shows its work.** Real code, its real output, and a note where a
  result is illustrative rather than from a run.
- **One idea runs through several tracks on purpose.** Zero against missing
  appears in DBMS, Java and JavaScript. Idempotency appears in networks, SQL and
  HTML forms. Stability appears in data structures and SQL. Those connections are
  the argument of the course and they should survive editing.
- **Check the component syntax first.** `::pros-cons` and `::persona` take YAML
  front matter, `::memory{kind="table"}` renders one row per frame, and
  `::timeline-item` states are `done`, `current`, `todo`.
