# Contributing

Thank you. This guide exists because nobody wrote it down for me in 2018, and
every correction makes it more useful to the next person sitting in a PG in
BTM Layout.

## The easiest ways to help

- **Found a mistake in a lesson?** Wrong code, a wrong answer, a broken link.
  Open an issue with the "Mistake in a lesson" template, or fix it directly: every
  lesson has an "Edit this page" link that opens the file on GitHub.
- **Got a job with the help of this guide?** Share your story on the site at
  `/stories`. That helps more than any pull request.
- **Something about the app is broken?** Open a bug report.

## Running it locally

```bash
git clone https://github.com/imswarnil/Job-Seekers-Guide.git jobseekers.imswarnil.com
cd jobseekers.imswarnil.com
pnpm install
pnpm dev                  # http://localhost:3000
```

Node 22 and pnpm 11. The lessons work without any configuration. Sign-in,
stories, payments and `/admin` need the environment variables in
`.env.example` (see `docs/backend.md`); without them those pages show a
"not configured" state instead of failing.

## Writing or editing a lesson

Read `AUTHORING.md` first: it is the style guide for the whole guide (the
narrator, the page shapes, the components). The short version:

- first person, plain English, British spelling;
- no em dashes, no "simply", "just" or "obviously", no exclamation marks;
- every code sample shows its real output;
- examples use a college (students, courses, marks), never `foo` and `bar`.

Before opening a pull request:

```bash
pnpm check:lessons   # structure, component nesting, em dashes
pnpm lint
pnpm typecheck
```

## Pull requests

Keep them small and about one thing. Describe what was wrong and how you
checked the fix. By contributing you agree that code you add is MIT licensed
and writing you add to `content/` is CC BY-NC-SA 4.0, like the rest.

Be kind. Everyone here was a beginner once; see `CODE_OF_CONDUCT.md`.
