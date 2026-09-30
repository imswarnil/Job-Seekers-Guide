<script setup lang="ts">
/**
 * The reading surface, on the grid.
 *
 *   header band   the title block, full frame width, a rule under it
 *   body band     the page on columns 1–8, the column beside it on 9–12
 *   pager         the lesson bar, stuck to the bottom of the content pane
 *
 * Both bands carry the column guide lines. Below `xl` the side column drops
 * under the page (its table of contents is replaced by the compact one above
 * the prose).
 */
</script>

<template>
  <div
    class="shell"
    :data-pager="$slots.pagination ? '' : undefined"
  >
    <header class="shell__hero guides">
      <div class="frame">
        <div
          v-if="$slots.toolbar"
          class="mb-4"
        >
          <slot name="toolbar" />
        </div>

        <slot name="hero" />
      </div>
    </header>

    <div class="shell__body guides">
      <div class="frame swiss-grid">
        <div class="shell__main">
          <slot />
        </div>

        <aside
          v-if="$slots.aside"
          class="shell__aside"
          aria-label="About this page"
        >
          <slot name="aside" />
        </aside>
      </div>
    </div>

    <footer
      v-if="$slots.pagination"
      class="shell__pager"
    >
      <slot name="pagination" />
    </footer>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.shell__hero {
  padding-block: 2.5rem 2rem;
  border-bottom: 1px solid var(--rule-color);
}

@media (min-width: 1024px) {
  .shell__hero {
    padding-block: 4rem 2.5rem;
  }
}

.shell__body {
  flex: 1;
  padding-block: 2.5rem 4rem;
}

.shell__main {
  grid-column: 1 / -1;
  min-width: 0;
}

.shell__aside {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 4rem;
  min-width: 0;
}

@media (min-width: 640px) and (max-width: 1279px) {
  .shell__aside {
    grid-column: 1 / span 6;
  }
}

@media (min-width: 1280px) {
  .shell__main {
    grid-column: 1 / span 8;
  }

  .shell__aside {
    grid-column: 9 / -1;
    margin-top: 0;
  }
}

.shell__aside > :deep(*) {
  flex-shrink: 0;
}

/* The contents only exists here on a wide screen. */
.shell__aside > :deep(.shell-toc) {
  display: none;
}

@media (min-width: 1280px) {
  .shell__aside > :deep(.shell-toc) {
    display: block;
    max-height: 60vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
  }
}

/* The one block in the column that holds its place once reached. It sticks to
   the top of the content pane, which is the scroller. */
.shell__aside > :deep(.shell-sticky) {
  position: sticky;
  top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* The lesson bar: always at the bottom of the pane, whatever the scroll. */
.shell__pager {
  position: sticky;
  bottom: 0;
  z-index: 20;
  margin-top: auto;
}
</style>
