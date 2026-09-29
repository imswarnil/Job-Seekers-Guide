---
title: CSS
description: "The page is structured and plain. This is where it gets a look that works on a phone: selectors, specificity, the box model, Flexbox, Grid and responsive design, asked in every fresher web interview."
code: JSG-09
duration: 2 weeks
stage: web
icon: i-simple-icons-css
outcomes:
  - You can attach CSS to a page three ways and say which one wins
  - You can calculate specificity for any selector and predict which rule applies
  - You can explain the box model and work out an element's real width from its CSS
  - You can lay out a page with Flexbox and Grid, and say which one to use and why
  - You can make one page work from a 360px phone to a desktop with media queries
  - You can answer the CSS round of a fresher interview without guessing
prerequisites:
  - html
---

The HTML track left you with a document that is correct and looks like 1995.
Every heading is Times New Roman, every form field is the browser's default grey
box, and on a phone the text runs off the edge. CSS is the language that fixes
that, and it is the one most people half-learn.

## Why this track matters in an interview

Web technologies were one of the three things I studied at JSpiders, and CSS was
the part I thought I knew until somebody asked me a question about it. I could
make a page look right on my own laptop by adding rules until it stopped looking
wrong. I could not have told you why a rule was being ignored, and that is
exactly what an interviewer asks.

Fresher web interviews ask the same handful of CSS questions again and again:

::feature-list{columns="2"}
  :::feature{icon="i-lucide-target" title="Specificity"}
  Which of these two rules wins, and why. Asked as a puzzle with three selectors
  on a whiteboard.
  :::
  :::feature{icon="i-lucide-box" title="The box model"}
  How wide is this element really. A number you can calculate, not a feeling.
  :::
  :::feature{icon="i-lucide-move" title="Position and display"}
  Absolute against relative, `display: none` against `visibility: hidden`.
  :::
  :::feature{icon="i-lucide-layout-grid" title="Flexbox and Grid"}
  How to centre something, and which layout tool you would choose for a page.
  :::
::

Every one of those has a precise answer, and this track gives you it.

## The chapters

::flow{numbered direction="vertical"}
  :::flow-step{label="Applying style" icon="i-lucide-paintbrush"}
  How CSS reaches an element, the cascade, selectors, specificity, the box model
  and units.
  :::
  :::flow-step{label="Layout" icon="i-lucide-layout-grid" highlight}
  Display, position, Flexbox and Grid: the part most people stay weak at.
  :::
  :::flow-step{label="Responsive design" icon="i-lucide-smartphone"}
  The viewport tag, mobile-first media queries, fluid sizes, custom properties
  and transitions.
  :::
  :::flow-step{label="Revision" icon="i-lucide-book-check"}
  A glossary, an interview bank of more than twenty questions, and exercises.
  :::
::

::callout{icon="i-lucide-arrow-right"}
Start with the question every beginner asks within an hour of writing CSS: "why
is my style being ignored?" It has a short list of answers, and the first is
how the style reached the page at all.
::
