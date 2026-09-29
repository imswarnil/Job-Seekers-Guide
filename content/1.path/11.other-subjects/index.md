---
title: Other subjects
description: The subjects a fresher gets asked about beyond Java, SQL and the core four. SDLC and Agile, testing, Git, Linux, the cloud, how a web request travels, and the number systems the written round still tests.
code: JSG-11
duration: 3 weeks
stage: cs
icon: i-lucide-library
outcomes:
  - You can name the SDLC models, say when each one fits, and explain why most teams now call themselves Agile
  - You can describe a Scrum team's roles, ceremonies and sprint well enough to sound like you have been in one
  - You can tell smoke from sanity, regression from retesting, and write a test case another person can run
  - You can use Git from the terminal, from the first commit to a pull request, and undo a mistake without losing work
  - You can move around a Linux machine, read and change permissions, search files and stop a runaway process
  - You can explain IaaS, PaaS and SaaS, a web request end to end, and convert between binary, decimal and hex by hand
prerequisites:
  - javascript
---

The screen works. You can build a page, style it and make it react to a click.
What nobody has told you yet is that the interviewer who sees "Java, SQL, HTML,
CSS, JavaScript" on your résumé will, about ten minutes in, ask something that
belongs to none of them.

## Why this track exists

"What is the difference between smoke and sanity testing?" "What is a sprint?"
"How do you undo a commit that is already pushed?" "What does `chmod 755` do?"
"Convert 156 to binary." I was asked every one of those in the walk-ins of
2018, and I had an answer for about half. None of them are hard. They sit in the
gaps between the subjects you studied, and a fresher who fills those gaps sounds
like somebody who has already worked in a team.

::feature-list{columns="2"}
  :::feature{icon="i-lucide-workflow" title="How software gets made"}
  SDLC models, Agile and Scrum. The first thing a service company's HR round and
  technical round both assume you know.
  :::
  :::feature{icon="i-lucide-bug" title="Testing"}
  Levels, types, the life cycle and the bug life cycle. Asked in every testing
  role and in plenty of developer ones.
  :::
  :::feature{icon="i-lucide-git-branch" title="Git and GitHub"}
  Used from your first day at work. Asked about more every year.
  :::
  :::feature{icon="i-lucide-square-terminal" title="Linux"}
  The machine your code will run on is almost certainly Linux, even if yours is
  not.
  :::
  :::feature{icon="i-lucide-cloud" title="Cloud and the web"}
  Awareness, not certification. Enough to answer "what is SaaS" without
  guessing.
  :::
  :::feature{icon="i-lucide-binary" title="The machine"}
  Compilers, memory, binary and hex. Old questions that still appear in written
  rounds.
  :::
::

::tip
This track is wide and shallow on purpose. Three weeks at an hour or two a day is
enough. Do not try to become a tester, a Linux administrator and a cloud
architect at once. The aim is one confident, correct paragraph on each topic.
::

## The chapters

::flow{numbered direction="vertical" caption="Five chapters, ending with a glossary, an interview bank and exercises."}
  :::flow-step{label="How software gets made" icon="i-lucide-workflow"}
  Waterfall, V-model, iterative, spiral, Agile. Then Scrum, and a day inside it.
  :::
  :::flow-step{label="Testing" icon="i-lucide-bug"}
  Manual and automation, levels and types, STLC, the bug life cycle, test cases.
  :::
  :::flow-step{label="Git and GitHub" icon="i-lucide-git-branch" highlight}
  The chapter you will use most, from the first week of the first job.
  :::
  :::flow-step{label="Linux commands" icon="i-lucide-square-terminal"}
  Navigation, files, permissions, grep, find, pipes and processes.
  :::
  :::flow-step{label="The machine and the web" icon="i-lucide-server"}
  Cloud basics, a web request end to end, compiler and interpreter, the memory
  hierarchy and number systems.
  :::
::

::callout{icon="i-lucide-arrow-right"}
Start with the question every company's first technical round seems to open
with: before anybody wrote a line of code, how did the team decide what to build
and in what order?
::
