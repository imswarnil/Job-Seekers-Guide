---
title: The build
description: Everything so far was so that you could build this. One system, the University Management App, from written requirements to a URL a stranger can open, decided on paper before a line is typed.
code: JSG-16
duration: 8 weeks
stage: build
icon: i-lucide-hammer
outcomes:
  - Turn a vague request into written requirements with acceptance criteria
  - Draw the architecture, the data model and the access model before typing
  - Build the admissions pipeline the university actually runs on
  - Test the rules that cost money when they are wrong
  - Explain every decision you made, and the one you would now make differently
prerequisites:
  - toolchain
---

You have a language, a database, a browser, types, components and a build. Every
one of those was learned against the same university, and none of them has been
joined up. This is the track where they are.

## What you are building

The **University Management App**: the software a university actually runs on. Not
a demonstration of a framework. A system with a registrar who depends on it.

::feature-list{columns="2"}
  :::feature{icon="i-lucide-globe" title="The public site"}
  Home, programmes, admissions and the enquiry form. The front door a stranger
  lands on, fast and readable on a phone.
  :::
  :::feature{icon="i-lucide-filter" title="The admissions pipeline"}
  `RECEIVED` → `UNDER_REVIEW` → `SHORTLISTED` / `REJECTED` → `ACCEPTED`, with
  notes, reviewers, source tracking and duplicate detection.
  :::
  :::feature{icon="i-lucide-user" title="The student portal"}
  Results, registration, attendance, fee status and history.
  :::
  :::feature{icon="i-lucide-presentation" title="The teacher portal"}
  Class lists, attendance, marks, and flagging a student for follow-up.
  :::
  :::feature{icon="i-lucide-settings" title="The admin console"}
  Departments, programmes, seats, cutoffs, faculty and fee structures.
  :::
  :::feature{icon="i-lucide-chart-line" title="The dashboards"}
  The funnel, fee collection, attendance against performance, and the at-risk
  list.
  :::
::

## Why this track is shaped the way it is

The first chapter contains no code at all, and that is deliberate.

I have watched people open an editor on day one of a project, and I have done it
myself. You get a login screen in an evening and feel fast. Three weeks later
you are rewriting the schema, because nobody wrote down that a student can
re-register for a subject they failed, and the table you designed cannot hold
that fact twice.

::pull-quote
The hours you spend deciding are not hours away from building. They are the only
reason the building goes anywhere.
::

So: requirements, architecture, the data model, the access model, the interface
plan. Then you type.

## What you get out of it

Something to talk about. Every round after this one asks a version of "tell me
about something you built", and the answer that works is not a list of
technologies. It is a decision, the alternative you rejected, and why.

::note
This track gives you the **plan and the acceptance criteria**: the files, the
tables, the routes, the columns, and what "done" means for each piece. It does
not hand you the finished code, because a system you assembled from somebody
else's answers is one you cannot defend in a room.
::
