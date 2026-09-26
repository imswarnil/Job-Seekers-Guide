# Where this branch got to, and what is next

Branch: **`ai-era-curriculum`**. Three commits, all green on `pnpm lint`.
The dev server was running on port 3002 while this was written; the design, the
story page and the new lessons were all checked in a browser.

## Done

**The Im Design System is in.** `app/assets/css/main.css` now maps this site's
Tailwind theme onto design.imswarnil.com's tokens. Geist, Geist Mono and Geist
Pixel are vendored into `public/fonts/` with the source commit recorded in
`public/fonts/SOURCE.md` — the old stack named three fonts and shipped none of
them, so every visitor was reading this site in their system font. Indigo and
teal became one accent; `spark` survives only so a chart can have a second
series. The greys are achromatic now. The golden-ratio ladder is exposed as
Tailwind spacing, so `gap-phi-5` works in a template.

**The story is one page.** `content/6.story` (16 chapters), `content/5.series`
(10 episodes), the book reader, the CRT television and about 2,400 lines of
component are gone. `content/5.my-story.md` + `app/pages/my-story.vue` replace
them: fifteen chapters as `::story-chapter` bands with number, year, place and
phase, four pull quotes, the salary chart, and a rail that is a real timeline
grouped into five phases. Every old URL redirects, in all four mechanisms this
repo uses to say that.

**The header was never sticky** and is now. `UHeader`'s own `sticky top-0` was
doing nothing because its wrapper div is one header tall, so it had nowhere to
travel. Fixed in `AppHeader.vue`.

**Orientation is written**: five chapters, 18 lessons.

**English is a new track at `content/1.path/01.english`**, and every track after
it is renumbered one higher. Chapter 1 (the written round) is complete with its
glossary and interview Q&A; chapter 2 (reading like an engineer) has two of four.

## Next, in order

1. **Finish English.** `02.reading-like-an-engineer` needs *Reading
   documentation* and *Reading somebody else's code*. Then `03.writing-that-gets-read`
   (commit messages, bug reports, status updates, email, documentation) and
   `04.speaking-and-being-understood` (stand-up, explaining a bug, asking for
   help, "tell me about yourself"), each with a glossary and an interview Q&A.
2. **The technical tracks, in path order**: operating systems, computer networks,
   DBMS, data structures, Java, SQL, HTML, CSS, JavaScript, data visualisation,
   the toolchain, TypeScript, React, Next.js, NoSQL, Supabase, hosting, AI,
   interview. Every one of them currently has a written `index.md` and no
   chapters. `content-plan.md` Parts B and C already specify the lessons and the
   exact cliffhanger each one ends on — follow it rather than inventing.
3. **Java and SQL carry the most weight** and should be written first of the
   nineteen: they are the two the whole course rests on, and they are what an
   interviewer actually tests.

## Rules that were established while writing, and are worth keeping

- **The narrator journals.** Swarnil is writing with hindsight about the years he
  could not get a job. Present-tense hindsight, named failures, real numbers.
- **The university, always.** Applicant, Application, Programme, Department,
  Student, Faculty, Subject, ExamResult, Attendance, FeePayment. Every example,
  including the throwaway ones.
- **Every lesson shows its work.** Real code, its real output, and where a result
  is illustrative rather than from a run, it says so.
- **No em dashes** in lesson prose. En dashes in numeric ranges only.
- **Check the component syntax before using it.** `::pros-cons` and `::persona`
  take YAML front matter, not attributes, and `::timeline-item` states are
  `done`, `current`, `todo`. `.studio/components.md` is the reference.
- **Nested MDC needs deeper fences.** A `::callout` inside a `::story-chapter` is
  `:::callout`, closed with `:::`.
