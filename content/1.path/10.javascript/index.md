---
title: JavaScript
description: The language of the browser, to the depth a fresher web interview asks. You already know Java, so this moves fast on loops and slow on the parts that bite. Scope, closures, this, equality and asynchronous code.
code: JSG-10
duration: 4 weeks
stage: web
icon: i-simple-icons-javascript
outcomes:
  - You can explain var, let and const, hoisting and the temporal dead zone with a worked example
  - You can predict the output of the classic == and typeof questions, and say why
  - You can write and explain a closure, and fix the loop-with-var bug
  - You can say what this points at in a method, a callback and an arrow function
  - You can use map, filter, reduce and friends on real data without mutating by accident
  - You can change a live page and handle events with one delegated listener
  - You can write fetch with async and await that handles a 404, and explain the event loop
prerequisites:
  - css
---

The page looks right and clicking anything does nothing. Nothing is listening.
That is the job of the third language the browser speaks, and the one every
web interview spends the most time on.

## Why this track exists

I studied Java, SQL and web technologies at JSpiders in Bangalore for about
three months, and of the three web languages JavaScript is the only real
programming language. It is also where fresher web interviews get hard. Nobody
asks you to write a `<table>`. They show you four lines and ask what they print.

You already know how to program from the Java track, so variables and loops go
quickly. The time goes on the parts that behave nothing like Java, because those
are exactly what an interviewer tests.

::feature-list{columns="2"}
  :::feature{icon="i-lucide-braces" title="The language"}
  `var`, `let` and `const`, types that change, `==` versus `===`, and functions
  that are values you can pass around.
  :::
  :::feature{icon="i-lucide-brackets" title="Scope, closures and this"}
  The three topics that decide most JavaScript interviews. Each gets its own
  lesson and its own output-prediction questions.
  :::
  :::feature{icon="i-lucide-list-tree" title="Objects and arrays"}
  The shapes all data takes, and the array methods you will write every day at
  work: `map`, `filter`, `reduce`, `find`, `sort`.
  :::
  :::feature{icon="i-lucide-timer" title="The browser and async"}
  The DOM, events and delegation, then promises, `async`/`await`, `fetch`, and
  the event loop, drawn rather than described.
  :::
::

## How to use it

Every lesson has code you can run in the page, and an output block showing what
it prints. Predict the output before you look. That habit is the whole
interview, and it is the one I wish somebody had drilled into me in 2018.

::callout{icon="i-lucide-arrow-right"}
Start with the short list of what is different after Java, then take the
differences one at a time.
::
