---
title: DBMS
description: The theory behind every database, at the depth a fresher's technical round asks it. Keys, ER diagrams, normalisation from 1NF to BCNF, transactions, locking, isolation levels and indexes, each worked on college tables.
icon: i-lucide-server
stage: cs
duration: 2–3 weeks
outcomes:
  - You can explain what a DBMS gives you that a file system does not, and draw an ER diagram for a college and turn it into tables
  - You can tell super, candidate, primary, alternate, foreign and composite keys apart and find every candidate key of a relation using attribute closure
  - You can normalise a table from 1NF to BCNF, showing the functional dependencies and a lossless decomposition at each step
  - You can explain ACID, schedules, conflict serialisability, two-phase locking and deadlock, and draw the precedence graph that proves a schedule safe or unsafe
  - You can name the four isolation levels, the anomaly each one still allows, and the default in MySQL and PostgreSQL
  - You can explain B+ tree indexes, clustered against non-clustered, and the basics of relational algebra and NoSQL, well enough to survive the follow-up question
---

SQL taught you how to ask a database anything. This track is about why it
answers the way it does: why tables are shaped the way they are, what happens
when two people write at the same moment, and how one row is found among
crores.

## Why this is its own track

I did not study DBMS at the institute. JSpiders taught SQL, and DBMS was one of
the subjects I read on my own in the PG in BTM Layout, alongside operating
systems, networks and aptitude. It paid for itself. In walk-ins, the technical
round would move from "write this query" to "what is normalisation" or "explain
ACID" without warning, and the interviewer could tell in two sentences whether I
had understood it or memorised it.

This track is written so you can answer the second way: every definition is
followed by a worked example on college tables, and every chapter ends with the
questions it produces.

## The chapters

::flow{numbered direction="vertical" caption="Five chapters, from why a database exists to the theory round."}
  :::flow-step{label="Foundations" icon="i-lucide-layers"}
  DBMS against a file system, the ER model, the relational model and every kind
  of key.
  :::
  :::flow-step{label="Normalisation" icon="i-lucide-copy-minus" highlight}
  Anomalies, functional dependencies, 1NF, 2NF, 3NF and BCNF, each with a worked
  decomposition.
  :::
  :::flow-step{label="Transactions and concurrency" icon="i-lucide-arrow-left-right"}
  ACID, schedules and serialisability, locking and deadlock, isolation levels.
  :::
  :::flow-step{label="Indexes" icon="i-lucide-list-tree"}
  B-trees and B+ trees, clustered and non-clustered indexes.
  :::
  :::flow-step{label="The theory round" icon="i-lucide-clipboard-check"}
  Relational algebra, SQL against NoSQL, the glossary, the interview bank and
  the exercises.
  :::
::

::warning{icon="i-lucide-alert-triangle"}
Normalisation and serialisability are the two places people memorise instead of
understand, and they are the two places an interviewer checks with a follow-up.
Work every example with a pen before reading the answer.
::

## Next

::callout{icon="i-lucide-arrow-right"}
Start with "DBMS versus a file system": the question every DBMS viva opens with,
and the reason the rest of the subject exists.
::
