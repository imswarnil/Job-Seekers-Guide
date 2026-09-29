---
name: write-lesson
description: Write, review or repair a page of the Bangalore Job Seekers Guide under content/1.path/. Use whenever the task is authoring guide content: a technical lesson, a guide page (the move, the written round, the interview), a story chapter, a glossary, an interview question bank or an exercises page, or checking an existing page against the house rules.
---

# Writing a page of the guide

## Read first

1. `CLAUDE.md`, all of it. It is the only spec: the narrator's facts (§2), the
   voice rules, the three page shapes (§3), the components and nesting (§4).
2. `to-do.md`, to see what is planned and what is done.
3. Two neighbouring pages in the same track, for the house style of that track.

Do not work from memory of them.

## The shapes

- **Technical lesson** (`kind: lesson`): opening line, Why this matters in a
  job, the idea, Syntax (complete example with a filename + its real output),
  Real use case, What confuses people here, Interview questions (`::accordion`),
  Next.
- **Guide page** (`kind: guide`): what it answers, Why it matters, What to study
  / What to do (a checklist), formulas / templates / tables, A worked example,
  Common mistakes, How to practise, Next.
- **Story chapter** (`kind: story`): year and place, the scene, at least one
  `::story-media` placeholder (no `src`), What this taught me, Next.

Every page ends with `## Next` and a `::callout{icon="i-lucide-arrow-right"}`.
The last page of a track names the first page of the next track.

## Hard rules

- No em dash `—` in prose. En dash only in numeric ranges.
- No "simply", "just", "obviously", "as we all know", "it is important to
  note", "capstone", exclamation marks.
- British spelling.
- No project is being built. Never "the app you are building".
- There is no Java runner. Java is a ```java [File.java] block plus a
  ```text [Output] block. `::runner` is for javascript, sql, html, css, python.
- Every code sample shows its real output. If it is illustrative, say so.
- Never invent a URL, a video id or a fact about Swarnil that §2 does not state.
  If a scene needs a detail you do not have, write around it or flag it.

## Before calling it done

```bash
pnpm check:lessons     # structure and em dashes
pnpm lint
```

Then open the page in `pnpm dev` and read it once as the reader would.
