<script setup lang="ts">
/**
 * The frame for the server-backed pages: stories, guestbook, sponsors,
 * support, stats, leaderboard, account and login.
 *
 * On the grid: a header band (label, headline, one paragraph, actions) with a
 * rule under it, then the page. `narrow` keeps the page to the first eight of
 * twelve columns, for forms and reading; `wide` gives it the whole frame.
 */
withDefaults(defineProps<{
  title: string
  description?: string
  kicker?: string
  icon?: string
  width?: 'narrow' | 'wide'
}>(), {
  width: 'narrow'
})
</script>

<template>
  <div
    class="community"
    :data-width="width"
  >
    <header class="community__band guides">
      <div class="frame swiss-grid">
        <div class="community__head">
          <p
            v-if="kicker"
            class="label"
          >
            <span class="mark" />
            {{ kicker }}
          </p>
          <h1 class="community__title headline">
            {{ title }}
          </h1>
          <p
            v-if="description"
            class="community__description lede"
          >
            {{ description }}
          </p>
          <div
            v-if="$slots.actions"
            class="community__actions"
          >
            <slot name="actions" />
          </div>
        </div>
      </div>
    </header>

    <div class="community__page guides">
      <div class="frame swiss-grid">
        <div class="community__body">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.community {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.community__band {
  padding-block: 2.5rem 2rem;
  border-bottom: 1px solid var(--rule-color);
}

@media (min-width: 1024px) {
  .community__band {
    padding-block: 4rem 2.5rem;
  }
}

.community__head,
.community__body {
  grid-column: 1 / -1;
  min-width: 0;
}

.community__title {
  margin-top: 1rem;
}

.community__description {
  margin-top: 1rem;
}

.community__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.75rem;
}

.community__page {
  flex: 1;
  padding-block: 2.5rem 5rem;
}

@media (min-width: 1024px) {
  .community__head {
    grid-column: 1 / span 9;
  }

  .community[data-width='narrow'] .community__body {
    grid-column: 1 / span 8;
  }
}
</style>
