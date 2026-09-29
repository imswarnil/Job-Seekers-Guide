---
title: HTML
description: "The document the server sends back when you ask for a page. Structure, semantic tags, forms and input types, tables, accessibility and the head: enough HTML to answer a fresher web interview without guessing."
code: JSG-08
duration: 1–2 weeks
stage: web
icon: i-simple-icons-html5
outcomes:
  - You can write a complete HTML document and explain what the doctype, head and body each do
  - You can choose between div, section, article and the other semantic tags, and say why it matters
  - You can build a form with the right input types, labels and built-in validation, and explain GET versus POST
  - You can mark up a data table properly, with headings, scope and a caption
  - You can make a page usable with a keyboard and a screen reader, and name what an audit tool cannot catch
  - You can explain the meta tags in the head, and defer versus async on a script
prerequisites:
  - computer-networks
---

The networks track ended with a server answering your request with `200 OK`
and a body of text. That text is almost always HTML, and this track is about
what is in it.

## Why this track exists

At JSpiders the web module came after Java and SQL, and HTML was the part
everybody in my batch treated as a holiday. The tags take a weekend to learn,
which is exactly why most people learn them badly: they learn the tags and never
learn what the tags *mean*. In walk-in interviews for web and full-stack roles in
Bangalore, the first technical round very often opens with HTML, because it is
fast to ask and it separates people within about ninety seconds. "What is
semantic HTML?", "difference between GET and POST", "what does the viewport meta
tag do", "defer or async?" are asked of freshers again and again.

It also matters outside the interview. Salesforce, where I ended up, renders
HTML in every page it builds, and a badly structured form costs real people real
time.

::real-life{title="The form that lost a term's admissions" source="A college admissions office"}
An enquiry form built entirely from `div` elements and click handlers worked
perfectly in testing. It could not be submitted with a keyboard, screen readers
announced nothing, and the browser's autofill never triggered, so on mobile,
where most enquiries came from, people abandoned it halfway. Nothing was broken.
Everything was meaningless.
::

## The chapters

::flow{numbered direction="vertical"}
  :::flow-step{label="Structure" icon="i-lucide-code-xml"}
  What HTML is for, and how a browser reads a document: doctype, head, body,
  elements, attributes, block and inline.
  :::
  :::flow-step{label="Content and semantics" icon="i-lucide-file-text"}
  Text, links and images; the landmark tags; audio, video, iframes and data
  attributes.
  :::
  :::flow-step{label="Forms and tables" icon="i-lucide-list-checks" highlight}
  How a form sends data, every input type, validation, and tables.
  :::
  :::flow-step{label="Accessibility and the head" icon="i-lucide-accessibility"}
  Keyboard, screen reader, ARIA used sparingly; meta tags, scripts, and browser
  storage.
  :::
  :::flow-step{label="Revision" icon="i-lucide-book-check"}
  Glossary, twenty-five interview questions, and exercises.
  :::
::

::callout{icon="i-lucide-arrow-right"}
Start with the thing most people get wrong about HTML: it does not describe how
a page looks.
::
