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
| Before you begin, English, The machine | Full: chapters, glossaries, interview Q&A, exercises |
| Operating systems, Networks, Databases, Data structures | Full |
| Java, SQL | Full, and the deepest. SQL now ends on The API, where the two join |
| HTML, CSS, JavaScript | Two chapters each, worked projects, glossary and interview Q&A |
| Charts, The toolchain, TypeScript, React, Next.js, NoSQL, Auth, Going live | The decision each track exists to teach, plus a glossary |
| AI | Full: what a model does, how one is made, what it costs, retrieval, tools and MCP, the limits, the toolkit |
| The interview | Full |

**172 lessons, 22 subjects, ~34 hours of reading.** Every title is short; the
nuance lives in the description, which is what cards and search show.

## What is left

1. **Nuxt Studio needs its OAuth app.** `/_studio` returns
   `404 No authentication provider found` until `STUDIO_GITHUB_CLIENT_ID` and
   `STUDIO_GITHUB_CLIENT_SECRET` are in `.env`. There is no token-only route and
   no development bypass — the handler looks only for a client id, whatever
   `setup.md` used to say. Creating the OAuth app needs your GitHub account, so
   it is the one step nobody else can do for you. `setup.md` §1 has it.
2. **Interview-question files** for the eight shorter tracks. They have their
   glossary; HTML, CSS and JavaScript also have their Q&A, and the rest do not.
3. **More chapters for the web and build tracks.** Each currently teaches the
   one decision that track exists for. `content-plan.md` Part C lists the rest.
4. **The 258 em dashes** in lessons written before this branch, mostly the
   terminal track. `pnpm check:lessons` lists them. Fix by hand: a script makes
   the prose worse, which is why they were left.
5. **The University Management App's build lessons.** Every track references it
   and the `project` lessons give plans and acceptance criteria rather than
   finished code, which is deliberate. `content-plan.md` §26 is the spec.
6. **Media for the story.** Five `::story-media` placeholders are reserving
   their exact space; adding a `src` is the only change needed and nothing
   moves.

## Not done, and why

**The tracks were not re-sequenced.** The order already runs scratch →
foundations → language → web → tools → build → AI → job, and the stage grouping
now says so. Moving Java ahead of the CS foundations would mean rewriting the
handover paragraph at the end of roughly twenty tracks, because every lesson ends
on a hook the next one answers. It is a deliberate half-day, not a rename.

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
