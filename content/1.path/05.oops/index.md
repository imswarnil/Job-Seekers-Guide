---
title: OOPs
description: The Java track taught you to write a class. This track teaches you to explain one. The four pillars, the relationships, SOLID and the design patterns, the way an interviewer asks about them.
code: JSG-05
duration: 2 weeks
stage: cs
icon: i-lucide-boxes
outcomes:
  - You can explain the four pillars of OOP with a Java example for each, without reciting a textbook definition
  - You can tell overloading from overriding, and abstract class from interface, and say when you would pick each
  - You can draw the difference between association, aggregation and composition, and argue for composition over inheritance
  - You can answer the static, final, this, super and equals/hashCode questions with code that proves the answer
  - You can name the SOLID principles and show a small violation and fix for each
  - You can write Singleton, Factory, Builder, Observer and Strategy from memory and say where each one is used
prerequisites:
  - java
  - dbms
---

"OOPs" is what every fresher interview in Bangalore calls it, with the extra
"s", and it is the subject that comes up in more technical rounds than any other.
When I was going to walk-ins in 2018, I could write a Java class and I could not
explain one. That gap cost me more rounds than DSA did.

## Why this is a separate track

The Java track already taught you the syntax: `class`, `new`, `extends`,
`implements`, `@Override`. You wrote classes and ran them. This track does not
teach that again. It teaches the **concepts behind the syntax**, and how to say
them out loud in two minutes with an example the interviewer cannot poke a hole in.

That is a different skill. "What is polymorphism?" is not a question about
syntax. It is a check that you know **why** the language has the feature, and
the fresher who answers with "one name, many forms" and stops there is the one
who gets the follow-up they cannot answer.

::compare{caption="The same question, two answers. Only one survives a follow-up."}
  :::compare-side{label="The memorised answer" verdict="wrong"}
  "Polymorphism means many forms. There are two types, compile-time and
  runtime." Then silence.
  :::
  :::compare-side{label="The answer this track builds" verdict="right"}
  "The same call does different things depending on the real object. Here is a
  `FeeCalculator` for hostel and day students, one method, two behaviours, and
  the JVM picks at runtime." Then the code.
  :::
::

## The chapters

::flow{numbered direction="vertical" caption="Five chapters, twenty lessons. Each chapter is one layer of the question an interviewer builds up to."}
  :::flow-step{label="The idea" icon="i-lucide-lightbulb"}
  Procedural against object-oriented, class and object, constructors.
  :::
  :::flow-step{label="The four pillars" icon="i-lucide-columns-4" highlight}
  Encapsulation, abstraction, inheritance, polymorphism, then overloading against
  overriding.
  :::
  :::flow-step{label="Relationships" icon="i-lucide-network"}
  Abstract class against interface, then is-a against has-a and composition over
  inheritance.
  :::
  :::flow-step{label="The keywords" icon="i-lucide-key-round"}
  Access modifiers, `static`, `final`, `this`, `super`, and the `Object` methods.
  :::
  :::flow-step{label="Design" icon="i-lucide-drafting-compass"}
  SOLID, five design patterns, coupling and cohesion. Then the glossary, the
  interview bank and the exercises.
  :::
::

## How to study it

Two weeks, about an hour and a half a day, is what it took me the second time
round. Type every example, run it, and then close the page and explain it to a
wall. If you cannot explain it without looking, you do not know it yet, and the
interview is not the place to find out.

::tip
Keep one notebook page per pillar. On each page: a one-line definition in your
own words, the university example from the lesson, and the one follow-up question
it usually draws. That page is what you read on the bus to the walk-in.
::

::callout{icon="i-lucide-arrow-right"}
Start with the question nobody asks and everybody should: why did anybody invent
objects in the first place?
::
