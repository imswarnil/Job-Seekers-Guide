<script setup lang="ts">
/**
 * ::pull-quote — one sentence, set large, breaking the column.
 *
 * Reserved for the lines that are the point of a chapter: the sentence somebody
 * said that changed the direction, or the one admission the page exists to make.
 * There is at most one per chapter. A page where every third paragraph is set
 * large has no emphasis at all, only noise.
 *
 * ```md
 * ::pull-quote{attribution="My sister, 2018"}
 * My brother is not going to live here. He is going to Bangalore.
 * ::
 * ```
 */
defineProps<{
  attribution?: string
}>()
</script>

<template>
  <figure class="pull not-prose">
    <blockquote class="pull__quote">
      <slot />
    </blockquote>
    <figcaption
      v-if="attribution"
      class="pull__by"
    >
      {{ attribution }}
    </figcaption>
  </figure>
</template>

<style scoped>
.pull {
  margin-block: var(--spacing-phi-6);
  padding-left: 1.125rem;
  border-left: 3px solid var(--color-guide-600);
}

.pull__quote {
  font-size: clamp(1.125rem, 1rem + 0.7vw, 1.5rem);
  line-height: 1.35;
  letter-spacing: -0.02em;
  font-weight: 500;
  color: var(--ui-text-highlighted);
  text-wrap: balance;
}

.pull__by {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  color: var(--ui-text-dimmed);
}
</style>
