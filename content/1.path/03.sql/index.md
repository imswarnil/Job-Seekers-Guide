---
title: SQL
description: The language every database speaks, taught from the first CREATE TABLE to the eight queries the SQL round asks in almost every Bangalore walk-in, on college tables you can run in the browser.
icon: i-lucide-database
stage: code
duration: 4–5 weeks
outcomes:
  - You can create tables with the right data types and constraints, and insert, update and delete rows without losing anything by accident
  - You can filter, sort, group and summarise data with WHERE, ORDER BY, GROUP BY and HAVING, and say which runs first and why it matters
  - You can join tables every way an interviewer asks (inner, left, right, full, self and cross) and write subqueries, correlated subqueries and set operations
  - You can use views, indexes and transactions, and explain what each one costs
  - You can rank and compare rows with window functions, and label them with CASE
  - You can write the classic interview queries on a whiteboard (Nth highest marks, duplicates, the self join, top N per group) and answer DDL, DML, DCL, TCL and DELETE against TRUNCATE against DROP
---

Your Java programs can hold a thousand students in an `ArrayList` and find one in
a `HashMap` in a single step. Then the program ends, and every one of them is
gone. SQL is how data outlives the program, and how you ask it questions
afterwards.

## Why this track matters so much

At JSpiders in 2018, SQL was taught alongside Java in the same three months,
and I nearly treated it as the easy half. That was a mistake. In the walk-ins
that followed, the technical round almost always had a SQL part: a query on
paper, "what is the difference between DELETE and TRUNCATE", "find the second
highest salary". A fresher who can write those cleanly stands out, because most
of the room cannot.

It also outlasted everything else I learned. I wrote SOQL (Salesforce's version
of SQL) at Accenture, and reporting queries every week as an analytics engineer
at Twilio. Frameworks came and went. The `SELECT` did not change.

::feature-list{columns="2"}
  :::feature{icon="i-lucide-play" title="Every query runs here"}
  Each example creates its own small college tables and runs in the browser on
  SQLite. Change it, run it, break it. Nothing is installed.
  :::
  :::feature{icon="i-lucide-table" title="Every query shows its result"}
  The output under each example is the real result, not a guess. Read it before
  you run it and predict it first.
  :::
  :::feature{icon="i-lucide-scan-eye" title="Correct, not merely runnable"}
  A query that runs without an error can still be wrong. Each lesson names the
  trap before you fall into it.
  :::
  :::feature{icon="i-lucide-messages-square" title="Interview questions in every lesson"}
  Each lesson ends with the questions its topic produces, answered the way a
  good candidate answers them.
  :::
::

## The chapters

::flow{numbered direction="vertical" caption="Seven chapters. The last one is the SQL round itself."}
  :::flow-step{label="First tables" icon="i-lucide-table-2"}
  What a database is, CREATE TABLE and data types, INSERT, UPDATE and DELETE.
  :::
  :::flow-step{label="Asking" icon="i-lucide-search"}
  SELECT, WHERE, ORDER BY, LIMIT, DISTINCT, LIKE, IN, BETWEEN and NULL.
  :::
  :::flow-step{label="Summarising" icon="i-lucide-sigma"}
  Aggregate functions, GROUP BY and HAVING.
  :::
  :::flow-step{label="Joining" icon="i-lucide-combine" highlight}
  Every join, subqueries, correlated subqueries, UNION, INTERSECT and EXCEPT.
  :::
  :::flow-step{label="Design and safety" icon="i-lucide-shield-check"}
  Constraints, views, indexes and transactions.
  :::
  :::flow-step{label="Analysing" icon="i-lucide-chart-line"}
  ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD and CASE.
  :::
  :::flow-step{label="The SQL round" icon="i-lucide-clipboard-check"}
  The classic queries, DDL against DML against DCL against TCL, DELETE against
  TRUNCATE against DROP, the glossary, the interview bank and the exercises.
  :::
::

::tip
Give it an hour a day and about four to five weeks. Joins and window functions
deserve slower days than the rest: they are a new way of thinking, not new
syntax.
::

## Next

::callout{icon="i-lucide-arrow-right"}
Start with the first lesson, "What a database is": the question of where data
goes when your Java program stops.
::
