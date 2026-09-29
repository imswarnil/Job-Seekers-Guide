# To do: the Bangalore Job Seekers Guide rebuild

Started 2026-09-29 on the branch `bangalore-guide`. The site stops being a
course that builds a project and becomes **one app**: Swarnil's journey from
Mahroni to a job, written as a path somebody like him can follow.

Status: `[x]` done · `[ ]` open · `[~]` needs Swarnil

As of 2026-09-29 every build step is done: 17 tracks, about 418 lessons, the
app shell, search, the story with media placeholders. `pnpm check:lessons`,
`pnpm lint`, `pnpm typecheck` and `pnpm generate` pass (556 pages).

---

## 0. Decisions (fixed)

- [x] **No building.** The University Management App, every `project` lesson and
      every "the app you are building" line go.
- [x] **An app, not a site.** No navbar, no footer menu, no marketing pages.
      Sidebar + search + lesson + previous/next. Home is the start screen.
- [x] **GitHub Pages only.** No Cloudflare Worker (the Java runner goes), no
      Supabase, no Neon, no server, no login.
- [x] **The story is a track, told last**, chapter by chapter, with image and
      video placeholders. The old one-page `/my-story` design is removed.
- [x] **Order of the guide** (folder numbers are the order):
      move → Java → DSA → SQL → DBMS → OOPs → OS → Networks → HTML → CSS →
      JavaScript → other subjects → quant → reasoning → verbal → interview →
      my story.
- [x] **Written round is a guide for now**: per topic, what to study, why it
      matters, the formulas, one worked example, how to practise. Full question
      banks come later.

## 1. Architecture

- [x] Branch `bangalore-guide`.
- [x] Reorder tracks with `git mv`; delete orientation, terminal, TypeScript,
      React, Next.js, charts, toolchain, project, hosting, NoSQL, Supabase, AI.
- [x] New `CLAUDE.md` (authoring spec for the new shape).
- [x] Content schema: new `stage` enum (`move | code | cs | web | written |
      interview | story`), new `kind` values (`guide`, `story`).
- [x] `app/utils/path.ts` stages rewritten for the new parts.
- [x] Delete the Cloudflare Java runner (`workers/`), the Java runner code,
      `/run`, the visualisers, `server/`.
- [x] Delete marketing pages and components: header, footer, landing bands,
      `/start`, `/faq`, `/changelog`, `/login`, `/signup`, `/my-story` page,
      About, newsletter, and the content behind them.
- [x] Keep privacy / terms / contact (AdSense needs them), linked from the
      sidebar foot, not from a menu.
- [x] Delete obsolete planning docs: `abstract/`, `book/`, `content-plan.md`,
      `next-step.md`, the University App writing guide in `plan/`.
- [x] Redirects for removed URLs (`/start`, `/faq`, `/changelog`, old tracks).
- [x] Shiki: Java, SQL, bash, HTML, CSS, JS highlighted; copy button on every
      code block.

## 2. The app shell and home

- [x] One layout: sidebar (brand, search button, progress, the guide by part,
      small links at the foot) + content. No header, no footer.
- [x] Mobile: a slim top bar with menu and search, sidebar as a slide-over.
- [x] Search on `/` and `⌘K`, over every lesson and heading.
- [x] Home: the promise in one screen, "continue where you left off", the
      journey at a glance (Mahroni → BTM → 34th walk-in → Accenture → Twilio →
      Europe), and the parts of the guide as a list with progress.
- [x] Lesson page: title, meta, body, table of contents, previous / next,
      "mark as finished".
- [x] Track page: outcomes and the chapter list.

## 3. Content

### The move (`/bangalore`)
- [x] Why this guide, and how to use it
- [x] Which city (Bangalore, Pune, Hyderabad, Chennai, NCR), and why Bangalore
- [x] The family conversation (government job vs private job)
- [x] Money: a six-month budget
- [x] Getting there: train, what to pack, documents
- [x] Areas: BTM, Marathahalli, Electronic City, HSR, Koramangala, Whitefield
- [x] Finding a PG: what to check, prices, red flags
- [x] Living there: food, transport, SIM, bank
- [x] Training institute vs online vs self-study
- [x] Choosing an institute: the 3-day demo trial
- [x] Online platforms, free and paid
- [x] The daily routine (institute + CS + aptitude + English)
- [x] Walk-ins: how they work, where to find them
- [x] Scams, fake offers, and bonds
- [x] Taking the first offer

### Learn to code
- [x] Java in depth: basics → OOP in Java → strings → exceptions → collections
      → generics → Java 8 (lambdas, streams, Optional) → multithreading →
      file I/O → JVM and memory → interview questions
- [x] DSA using Java: complexity, arrays, strings, recursion, linked lists,
      stacks and queues, hashing, searching, sorting, two pointers and sliding
      window, trees, heaps, graphs, dynamic programming, patterns, interview set
- [x] SQL: existing track, build references removed, interview set
- [x] DBMS: existing track, build references removed, interview set

### Computer science
- [x] OOPs (new): classes, the four pillars, overloading vs overriding,
      abstraction vs interface, SOLID, composition, interview set
- [x] Operating systems, computer networks: build references removed,
      handovers re-welded
- [x] HTML, CSS, JavaScript: build references removed, interview sets
- [x] Other subjects (new): SDLC and Agile, software testing, Git and GitHub,
      Linux commands, cloud basics

### The written round
- [x] Quantitative aptitude: every topic as a guide page
- [x] Logical reasoning: every topic as a guide page
- [x] Verbal ability: every topic as a guide page, plus email / essay writing

### The interview
- [x] Why "tell me about yourself" decides the interview
- [x] The template, and three worked answers (fresher, gap year, switcher)
- [x] How to answer a technical question (the format)
- [x] Explaining your code and your project
- [x] When you do not know the answer
- [x] The HR round: the questions and honest answers
- [x] Reading an offer: CTC vs in-hand, bonds, notice period
- [x] Negotiation: scripts, and the first switch

### My story (`/my-story`)
- [x] 18 chapters, 2018 to Europe, with image and video placeholders
- [~] **Swarnil:** drop the real photos and clips into `public/images/story/`
      and fill `src` on each `::story-media` (search the repo for
      `::story-media`)

## 4. Ship

- [x] `pnpm check:lessons`, `pnpm lint`, `pnpm typecheck`, `pnpm generate` pass
- [x] Walk the app in a browser: home, a lesson, search, mobile
- [x] Screenshots into `docs/screenshots/`
- [x] README rewritten: the idea, the story, screenshots, tags, how to run
- [x] Umbrella notes checked: the one line about this repo is still accurate
- [x] Fixed on the way: every lesson 404'd when reached with a trailing slash
      (how GitHub Pages serves folders); the in-browser JS runner lost async
      output and printed `undefined` / `NaN` wrongly
- [x] Fixed on the way: every hand-drawn `::diagram` lost `text-anchor`,
      `font-size`, `stroke-width` and dashes (the markdown pipeline camelCased
      them); `modules/rehype-svg-attributes.ts` restores them
- [x] Fixed on the way: three components rendered as raw text because of a
      `\"` inside an attribute; `pnpm check:lessons` now catches that
- [~] **Swarnil:** merge `bangalore-guide` into `main` to deploy

## Facts for Swarnil to confirm

The writers kept to the facts in `CLAUDE.md` §2, but some pages add colour
beyond them. Each is plausible and none contradicts §2; confirm or trim:

- [~] Years: walk-ins 2018–2019, first job and Accenture 2019, the switch and
      Cognizant 2022, Twilio 2023 (only §2 gives none of these as fact).
- [~] Details carried over from the old story page: Kota in 2013, ~1,000
      subscribers on the masked channel, the sister's ₹15,000 salary and
      ₹8,000 a month, the institute fee of about ₹40,000, Accenture at about
      3.6 LPA / ₹24,000 in hand, the teachers' names.
- [~] Rupee figures in the move track (PG rents by area, the six-month budget,
      train fares, laptop price) are estimates labelled "check today's".
- [~] Company question counts in the written round (TCS NQT, Infosys, Wipro,
      Accenture, Cognizant, Capgemini, AMCAT) are estimates, labelled so.
- [~] First-person lines such as "asked at more than one walk-in", SOQL at
      Accenture, reporting queries at Twilio, "Apex and flows" on the
      Accenture project. Search the tracks for "walk-in" and "Accenture".
- [~] The OS track duration says 3 weeks but grew to 29 lessons.

## Later

- Question banks for quant, reasoning and verbal (the guide pages come first).
- Real media in every story chapter.
- More DSA problems per pattern.
