---
title: Java, in depth
description: The Java a fresher is hired on in Bangalore, taken all the way from javac to the JVM, with the interview questions each topic produces.
icon: i-simple-icons-openjdk
stage: code
duration: 10–12 weeks
outcomes:
  - You can write, compile and run a Java program from the terminal, and explain what the JDK, JRE and JVM each do
  - You can explain what a variable, a reference, the stack and the heap are, and predict what a piece of code prints before running it
  - You can model a problem with classes, and answer every OOPs question a technical round asks, with code
  - You can pick the right collection, explain how a HashMap works inside, and sort objects with Comparable and Comparator
  - You can write Java 8 code with lambdas, streams and Optional, the way a code review expects it
  - You can explain threads, synchronisation, garbage collection and JDBC well enough to survive the follow-up questions
  - You can answer the thirty-odd Java questions that come up in almost every fresher interview, and prove each answer with code
---

You have a bed in a PG, a route to the institute, and a timetable. Java is the
first subject on it, and this is where I would start again if I had to.

When I sat in my first JSpiders Java class in 2018 I had an engineering degree
and could not have told you what `static` meant. Three months later I could
answer most of what the walk-in interviewers asked. Nothing in between was
hard. It was a lot of small ideas stacked in the right order, and this track is
that order.

## Why Java first

::pros-cons
---
title: Java as the language you learn properly
pros:
  - Most fresher openings in Bangalore service companies and product startups list Java, and most institutes teach it first
  - The technical round in a walk-in is usually "core Java plus SQL", and this track is the core Java half
  - Strict types and a compiler that refuses bad code show you what is really happening
  - DSA, OOPs and most coding rounds are asked in Java if you let them
cons:
  - Slower to a first running program than Python
  - Wordier than it needs to be, which feels like ceremony for the first fortnight
  - The build tools (Maven, Gradle) take a while to feel normal
---
::

::warning{icon="i-lucide-alert-triangle"}
The objects chapter is the hardest conceptual jump in the track. It took me two
weeks and I nearly gave up on it. That is normal. It is not a verdict on you.
::

## The chapters

::flow{numbered direction="vertical" caption="Eleven chapters. Each one exists because the one before it hit a wall."}
  :::flow-step{label="First steps" icon="i-lucide-play"}
  JDK, JRE and JVM, a program compiled by hand, variables, primitives, casting,
  operators and Scanner.
  :::
  :::flow-step{label="Strings, control flow and arrays" icon="i-lucide-type"}
  The String pool and immutability, StringBuilder, if and switch, loops,
  arrays and 2D arrays.
  :::
  :::flow-step{label="Methods and objects" icon="i-lucide-box" highlight}
  Pass-by-value, the stack and the heap, recursion, then classes, static,
  the four pillars of OOPs, packages, equals and hashCode, records and wrappers.
  :::
  :::flow-step{label="Exceptions and collections" icon="i-lucide-library"}
  Checked against unchecked, try-with-resources, then List, Set, Map, HashMap
  internals, Comparator and generics.
  :::
  :::flow-step{label="Java 8, threads and the JVM" icon="i-lucide-cpu"}
  Lambdas, streams, Optional, java.time, multithreading, file I/O, garbage
  collection, class loading, JDBC and JUnit.
  :::
  :::flow-step{label="Revision" icon="i-lucide-notebook-pen"}
  A glossary, an interview question bank and exercises to revise from the
  week of a walk-in.
  :::
::

## How to use it

- **Type every example.** Do not copy it. Compile it with `javac` and run it
  with `java` and check your output matches the one on the page.
- **Say the interview answers out loud.** Every lesson ends with the questions
  that topic produces. Reading an answer and saying it to a stranger are two
  different skills, and only the second one gets you through a technical round.
- **An hour of Java every day beats seven on Sunday.** At the institute I had
  Java in the morning and practised in the PG at night. About two hours a day
  of my own on top of class is what it took.

::callout{icon="i-lucide-arrow-right"}
Start with the question every interviewer opens with: what is Java, and what
exactly did you install when you installed it?
::
