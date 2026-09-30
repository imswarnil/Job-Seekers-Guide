# Bangalore Job Seekers Guide

This repository is **one app**: the guide Swarnil wished he had in 2018, when he
graduated, took the train from Mahroni to Bangalore with no skills and no plan,
and spent the next year learning, walking into 33 walk-ins and getting selected
in the 34th. It is his journey written down as a path somebody else can follow.

It is **not** a course that builds a project. Nothing here builds an app. It is a
guide: where to go, where to live, how to learn, what to study, how to clear the
written round, how to answer in the interview, and the story of how it went.


---

## 1. The shape of the app

There is no marketing site, no navbar, no footer menu. There is:

- a **sidebar** (the whole guide, in order, with progress),
- **search** (`/` or `⌘K`, over every lesson),
- the **lesson** you are reading, with previous / next.

The home page (`/`) is the app's start screen: the promise, "continue where you
left off", and the parts of the guide as a list. Nothing else.

The guide lives in `content/1.path/`, three levels deep: **track → chapter →
lesson**. The folder numbers are the order. There is no manifest.

| # | Track (URL) | Part |
| --- | --- | --- |
| 00 | `/bangalore` — Moving to Bangalore | The move |
| 01 | `/java` — Java, in depth | Learn to code |
| 02 | `/dsa` — DSA using Java | Learn to code |
| 03 | `/sql` — SQL | Learn to code |
| 04 | `/dbms` — DBMS | Computer science |
| 05 | `/oops` — OOPs | Computer science |
| 06 | `/operating-systems` | Computer science |
| 07 | `/computer-networks` | Computer science |
| 08–10 | `/html`, `/css`, `/javascript` | Web basics |
| 11 | `/other-subjects` — SDLC, testing, Git, Linux, cloud | Computer science |
| 12 | `/quantitative-aptitude` | The written round |
| 13 | `/logical-reasoning` | The written round |
| 14 | `/verbal-ability` | The written round |
| 15 | `/interview` — tell me about yourself, technical, HR, negotiation | The interview |
| 16 | `/my-story` — the whole journey, chapter by chapter | My story |

The part each track belongs to is its `stage` front matter:
`move | code | cs | web | written | interview | story`. Stages are display
grouping only; the folder number is the order, and a stage must never run
backwards relative to the folder numbers.

Hosting: **GitHub Pages**, static (`pnpm generate`), deployed by
`.github/workflows/deploy.yml` on push to `main`. No database, no Supabase, no
Neon, no Cloudflare, no server. Progress is `localStorage`. Code runners that
work in the browser (JavaScript, SQL) stay; nothing may call a backend.

---

## 2. The narrator

Every page is written by **one person: Swarnil, named**, first person, to one
reader. He is writing now, with hindsight, from Europe. His facts, which every
page must agree with:

- Small town, **Mahroni** (Uttar Pradesh). Engineering (CSE) at LNCT Bhopal,
  2014–2018. Average student, did not study well, never cleared a written round
  in college.
- After college he wanted to be a **YouTuber** but needed a job. His **father**
  wanted him to become a **government teacher**. His **sister** backed him, and
  together they decided he would move to **Bangalore**.
- Took the **train from Mahroni to Bangalore** (he has video and photos).
- Gave a few interviews, realised he **knew nothing** and had to upskill.
  Decided then to **document the job search**, so that when he got a job the
  record would become a path for someone like him. This guide is that promise.
- Stayed in **BTM Layout**, in a PG, because it is where job seekers live.
- Sat **3-day demo classes** at training institutes to compare them, chose
  **JSpiders**, and studied **Java, SQL and web technologies** there for about
  **3 months**. In parallel he studied the important CS subjects, **aptitude**
  and **English** on his own.
- Went to **33+ walk-ins**. At the **34th**, out of **700–1000** candidates, he
  was selected.
- First job at a **startup**: **1.8 LPA, ₹13,000 a month**, with a **bond**, six
  days a week, no Saturday off, no orientation, no training ("watch these Udemy
  courses"). Happy, not satisfied. Studied on Sundays and kept interviewing.
- **Two months later**, selected at **Accenture**: proper orientation, friends,
  assigned the **Salesforce** stream, trained, put on a project. He wanted web
  development and got Salesforce. That is how corporate works: you might get
  what you want if you fight for it.
- After **3 years** at about **5 LPA**, he met a friend who had been a job seeker
  with him. The friend had switched and was on **21 LPA**. He decided to switch.
- **Cracked 5 companies**, best offer **15.5 LPA**, joined **Cognizant**. Left
  after **9 months**: micromanagement and how people were treated.
- Kept interviewing, **cracked PwC and Twilio**, joined **Twilio at 30+ LPA** as
  a **Salesforce analytics** engineer in the **GTM** team, and learned GTM
  engineering.
- After **3+ years** at Twilio, **Education First (EF)** in Europe called, and
  **sponsored his visa**. He moved.

Voice rules (these are not optional):

- First person, "I" and "you". Never "students", never "we" meaning the reader.
- **Assume nothing.** Define every new word the first time, in plain English.
- **Say the number.** Rupees, months, hours, percentages.
- **Be honest.** No guaranteed jobs, no placement percentages, no hype. Prices
  and institute details are "what it was when I went, check today's".
- **British spelling.**
- **Banned:** "simply", "just", "obviously", "as we all know", "it is important
  to note", exclamation marks, and the word "capstone".
- **The em dash `—` is banned** in prose, hard rule. Use a full stop, comma,
  colon or brackets. The en dash `–` is allowed in numeric ranges only
  ("2014–2018", "3–4 weeks"). `pnpm check:lessons` reports them.
- Examples in technical tracks use a **college / university** domain
  (`Student`, `Course`, `Department`, `Faculty`, `ExamResult`, `Attendance`,
  `FeePayment`, `Placement`). Never `foo`/`bar`, never `Animal`/`Dog`/`Car`.
  There is **no project being built**: never say "the app you are building".

---

## 3. What a lesson looks like

Every lesson has front matter:

```yaml
---
title: Short and plain
description: One sentence for a stranger. Shown in search and on cards.
minutes: 12        # 200 words a minute, plus a minute per diagram
kind: lesson       # lesson | guide | practice | quiz | reading | story
---
```

Every track's `index.md` has `title`, `description`, `icon`, `stage`,
`duration`, `outcomes` (a list, "You can …"). Every chapter folder has a
`.navigation.yml` with `title`, `icon`, `description`.

**Technical lessons** (`kind: lesson`), in this order of headings:

1. No heading: one or two sentences picking up from the previous lesson.
2. `## Why this matters in a job` — where it shows up at work and in interviews.
3. `## <the idea, named plainly>` — analogy first, then the real thing.
4. `## Syntax` or `## How it works` — the syntax, then a **complete runnable
   example** in a fenced block **with a filename** (so it gets the language
   icon and the copy button), and its **real output** in a second block:

   ````md
   ```java [StudentMarks.java]
   public class StudentMarks { ... }
   ```

   ```text [Output]
   Average: 71.5
   ```
   ````

5. `## Real use case` — where this is used in a real codebase, with code.
6. `## What confuses people here` — the trap, named before they fall in.
7. `## Interview questions` — 3–6 questions inside `::accordion`, each answer
   short and proved with code where it can be.
8. `## Next` — one `::callout{icon="i-lucide-arrow-right"}` saying what comes
   next and why the reader needs it.

**Guide pages** (`kind: guide`: the move, the written round, the interview
advice) are checklists and decisions, not lectures:

1. No heading: what this page answers.
2. `## Why it matters` — which rounds / which situations, with numbers.
3. `## What to study` (or `## What to do`) — a checklist, in priority order.
4. Formulas / templates / scripts / tables, whatever the topic needs.
5. `## A worked example` where there is anything to work.
6. `## Common mistakes`.
7. `## How to practise` — daily target, time per question, where to practise.
8. `## Next`.

**Story chapters** (`kind: story`) are narrative, first person, with year and
place, and **media placeholders** where Swarnil has photos or video:

```md
::story-media{kind="video" label="The train from Mahroni to Bangalore, 2018"}
What the clip shows, one line.
::
```

`kind` is `image` (3:2) or `video` (16:9). Leave `src` out; adding it later is
the only change needed. Every story chapter ends with `## What this taught me`
(two or three lines a job seeker can use) and `## Next`.

**Last lesson of a track** hands over to the first lesson of the next track in
its `## Next` block, by name.

---

## 4. Components

Nuxt UI prose blocks: `::callout`, `::note`, `::tip`, `::warning`, `::caution`,
`::tabs` / `:::tabs-item{label="…"}`, `::steps`, `::accordion` /
`:::accordion-item{label="…"}`, `::card-group` / `:::card`, `::field`.

House blocks (in `app/components/content/`): `::compare` with `:::compare-side`
(`verdict="wrong" | "right"`), `::flow` / `:::flow-step`, `::memory`,
`::timeline` / `:::timeline-item` (`state` = `done | current | todo`),
`::feature-list` / `:::feature`, `::pros-cons` (YAML front matter),
`::persona` (YAML front matter), `::real-life`, `::side-note{kind=…}`,
`::code-trace`, `::pull-quote`, `::story-media`, `::diagram`, `::youtube`
(never invent an id).

`::runner` runs **javascript, sql, html, css, python** in the browser. There is
**no Java runner** (it needed a server): Java is a fenced ```java block plus its
output block.

**Nesting:** a child needs one more colon than its parent (`:::accordion-item`
inside `::accordion`) and closes with the same number. Never close a component
with a code fence. `pnpm check:lessons` catches both.

A component every screen or two. A wall of prose has failed.

---

## 5. Commands

```bash
pnpm dev              # http://localhost:3000
pnpm check:lessons    # structure + em dashes
pnpm lint
pnpm generate         # the static site, into .output/public
```

Before calling anything done: `pnpm check:lessons`, `pnpm lint`, `pnpm generate`
all pass, and the page renders.
