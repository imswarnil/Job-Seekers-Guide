<script setup lang="ts">
/**
 * The app. A sidebar, a slim bar across the top, and whatever you are reading.
 *
 * Wide screens keep the sidebar as a permanent column that can be folded away
 * for focus, from the control at the left of the top bar. Narrow screens hide
 * it, and the same control opens it over the page.
 */
const route = useRoute()
const { isNarrow, open, collapsed, toggle, close } = useRail()
const { open: openSearch } = useContentSearch()

// ⌘K / Ctrl+K is the palette's own shortcut; `/` is the one people know from
// every other docs site.
defineShortcuts({
  '/': () => {
    openSearch.value = true
  },
  '[': () => toggle()
})

watch(() => route.path, close)
</script>

<template>
  <div
    class="app"
    :data-sidebar="collapsed ? 'collapsed' : undefined"
  >
    <aside
      class="app__sidebar"
      aria-label="Sidebar"
    >
      <AppSidebar :current="route.path" />
    </aside>

    <div class="app__main">
      <AppNavbar />

      <main>
        <slot />
      </main>
    </div>

    <ClientOnly>
      <USlideover
        v-if="isNarrow"
        v-model:open="open"
        side="left"
        :ui="{ content: 'max-w-[20rem]', body: 'p-0 sm:p-0' }"
        title="The guide"
      >
        <template #content>
          <AppSidebar
            :current="route.path"
            @navigate="close"
          />
        </template>
      </USlideover>
    </ClientOnly>
  </div>
</template>

<style scoped>
.app {
  --sidebar-width: 18.5rem;
  /* The top bar's height. Nuxt UI's prose headings read this for their
     scroll margin, so a jump to an anchor lands below the bar, not under it. */
  --ui-header-height: 3.25rem;
  min-height: 100vh;
}

.app__sidebar {
  display: none;
}

.app__main {
  position: relative;
  min-width: 0;
}

@media (min-width: 1024px) {
  .app__sidebar {
    display: block;
    position: fixed;
    inset-block: 0;
    left: 0;
    width: var(--sidebar-width);
    border-right: 1px solid var(--ui-border);
    background: var(--ui-bg);
    z-index: 20;
    transition: transform var(--dgm-t-base) var(--dgm-ease);
  }

  .app__main {
    margin-left: var(--sidebar-width);
    transition: margin-left var(--dgm-t-base) var(--dgm-ease);
  }

  .app[data-sidebar='collapsed'] .app__sidebar {
    transform: translateX(-100%);
  }

  .app[data-sidebar='collapsed'] .app__main {
    margin-left: 0;
  }
}
</style>
