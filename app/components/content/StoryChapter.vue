<script setup lang="ts">
/**
 * ::story-chapter — one chapter of the story, as a designed band rather than as
 * another `## heading` in a wall of prose.
 *
 * The story is one page now, which solved the "pick a format before you care"
 * problem and created a new one: 2,500 words in a single column, which nobody
 * finishes. This is the fix. Each chapter gets a header you can recognise from
 * across the room — a number, a year, a place and which phase of the story it
 * belongs to — so the page reads as a sequence of scenes you can enter at any
 * point, and the rail beside it has something real to track.
 *
 * ```md
 * ::story-chapter{id="round-one" number="05" year="2018" place="Campus" phase="The gap" tone="low"}
 * ### Rejected in round one
 *
 * Placements came…
 * ::
 * ```
 *
 * `id` is what the chapter rail links to and what the IntersectionObserver
 * watches, so it must match the `chapters[].id` in the page's front matter.
 *
 * `tone` is `low`, `turn` or `up`, and it colours exactly one thing: the rule
 * down the left of the chapter. A story with a shape should look like it has
 * one, and three states is as much as a reader will ever decode. `turn` is the
 * accent, because the two chapters that turn the story are the point of it.
 */
withDefaults(defineProps<{
  /** Anchor. Must match an id in the page's `chapters` front matter. */
  id: string
  /** Printed large. A string, so "00" keeps its zero. */
  number?: string
  year?: string
  place?: string
  /** Which act this belongs to. Repeated across several chapters on purpose. */
  phase?: string
  tone?: 'low' | 'turn' | 'up'
}>(), {
  tone: 'low'
})
</script>

<template>
  <section
    :id="id"
    class="chapter not-prose"
    :data-tone="tone"
  >
    <header class="chapter__head">
      <p
        v-if="number"
        class="chapter__number font-pixel"
        aria-hidden="true"
      >
        {{ number }}
      </p>

      <div class="chapter__meta">
        <span
          v-if="phase"
          class="chapter__phase"
        >{{ phase }}</span>
        <span
          v-if="year"
          class="chapter__year"
        >{{ year }}</span>
        <span
          v-if="place"
          class="chapter__place"
        >{{ place }}</span>
      </div>
    </header>

    <!-- The prose comes back inside a `prose` wrapper, because the section
         itself is `not-prose` so the header above can be laid out freely. -->
    <div class="chapter__body prose dark:prose-invert">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.chapter {
  position: relative;
  padding-left: 1.5rem;
  padding-block: var(--spacing-phi-6);
  border-top: 1px solid var(--ui-border);
}

.chapter:first-child {
  border-top: 0;
  padding-top: var(--spacing-phi-5);
}

@media (min-width: 768px) {
  .chapter {
    padding-left: 2.618rem;
  }
}

/* The rule down the left. One colour per tone, and nothing else on the page
   uses it, so it reads as "the shape of the story" rather than as decoration. */
.chapter::before {
  content: '';
  position: absolute;
  left: 0;
  top: var(--spacing-phi-6);
  bottom: var(--spacing-phi-6);
  width: 2px;
  border-radius: 2px;
  background: var(--ui-border-accented);
}

.chapter:first-child::before {
  top: var(--spacing-phi-5);
}

.chapter[data-tone='turn']::before {
  background: var(--color-guide-600);
}

.chapter[data-tone='up']::before {
  background: var(--guide-milestone);
}

.chapter__head {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: var(--spacing-phi-4);
}

.chapter__number {
  font-size: 2.25rem;
  line-height: 1;
  color: var(--ui-text-dimmed);
  opacity: 0.45;
  flex-shrink: 0;
}

.chapter__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 0.875rem;
  font-size: 0.75rem;
}

.chapter__phase {
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ui-text-toned);
}

.chapter__year {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.chapter__place {
  color: var(--ui-text-dimmed);
}

/* The chapter title is an `###` inside the slot, so it is styled here rather
   than passed as a prop — an author writing a chapter should be writing
   markdown, not filling in a form. */
.chapter__body :deep(h3) {
  margin-top: 0;
  margin-bottom: 0.875rem;
  font-size: clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  scroll-margin-top: 6rem;
}

.chapter__body :deep(p:last-child) {
  margin-bottom: 0;
}

/* The reading measure lives here rather than on the page, so that a picture,
   a pull quote or a diagram can be wider than the text it sits between. */
.chapter__body :deep(p),
.chapter__body :deep(ul),
.chapter__body :deep(ol),
.chapter__body :deep(h3) {
  max-width: 64ch;
}
</style>
