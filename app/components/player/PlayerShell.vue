<script setup lang="ts">
/**
 * The reading surface: a full-width header band, the page with its contents
 * beside it, and previous / next at the foot. The sidebar belongs to the
 * layout, not to this, so every page in the app sits in the same frame.
 */
</script>

<template>
  <div class="shell">
    <header class="shell__hero">
      <div class="shell__inner">
        <div
          v-if="$slots.toolbar"
          class="mb-4"
        >
          <slot name="toolbar" />
        </div>

        <slot name="hero" />
      </div>
    </header>

    <div class="shell__body">
      <div class="shell__inner shell__columns">
        <div class="min-w-0">
          <slot />
        </div>

        <aside
          v-if="$slots.aside"
          class="shell__aside"
        >
          <div class="shell__aside-inner">
            <slot name="aside" />
          </div>
        </aside>
      </div>
    </div>

    <footer
      v-if="$slots.pagination"
      class="shell__pagination"
    >
      <div class="shell__inner">
        <slot name="pagination" />
      </div>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}

/* One inner wrapper, one max width, used by all three bands — so the hero, the
   prose and the pagination line up down the left edge instead of each finding
   their own margin. */
.shell__inner {
  max-width: 76rem;
  margin-inline: auto;
  padding-inline: 1rem;
  transition: max-width var(--dgm-t-base) var(--dgm-ease);
}

@media (min-width: 640px) {
  .shell__inner {
    padding-inline: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .shell__inner {
    padding-inline: 2.5rem;
  }
}

.shell__hero {
  padding-block: 1.5rem 2rem;
  border-bottom: 1px solid var(--ui-border);
}

/* Room for the sidebar's fold button, pinned in the top-left corner. */
@media (min-width: 1024px) {
  .shell__hero {
    padding-top: 3.75rem;
  }
}

.shell__body {
  padding-block: 2.5rem;
}

.shell__columns {
  display: grid;
  gap: 3rem;
}

/* The sidebar is genuinely wide — the old one was 14rem and could not hold a
   heading, an ad and a page action without all three being cramped. */
@media (min-width: 1280px) {
  .shell__columns {
    grid-template-columns: minmax(0, 1fr) 19rem;
    gap: 4rem;
  }
}

.shell__aside {
  display: none;
}

@media (min-width: 1280px) {
  .shell__aside {
    display: flex;
    flex-direction: column;
  }
}

/* The column scrolls with the page, as one piece. It used to be a single
   sticky box with its own scrollbar, which hid the author card and the page
   actions behind an inner scroll and, at its worst, squeezed the contents to
   nothing. Now everything in it is simply visible, and only the block marked
   `shell-sticky` (the sponsor spot and the ad) holds its place once the reader
   reaches it. The inner column fills the aside's full height, which is what
   gives that sticky block somewhere to travel. */
.shell__aside-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.shell__aside-inner :slotted(*) {
  flex-shrink: 0;
}

/* A short lesson's contents shows in full. Only a very long one is capped,
   and only then does it scroll inside itself. */
.shell__aside-inner :slotted(.shell-toc) {
  max-height: 70vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.shell__aside-inner :slotted(.shell-sticky) {
  position: sticky;
  top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.shell__pagination {
  border-top: 1px solid var(--ui-border);
  background: var(--ui-bg-elevated);
  padding-block: 2rem 3rem;
}
</style>
