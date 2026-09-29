<script setup lang="ts">
/**
 * The app. A sidebar and whatever you are reading, and nothing else.
 *
 * Wide screens keep the sidebar as a permanent column that can be folded away
 * for focus. Narrow screens get a slim bar with the menu and the search, and
 * the sidebar opens over the page.
 */
const route = useRoute()
const { isNarrow, open, collapsed, toggle, close } = useRail()
const { open: openSearch } = useContentSearch()

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
      <!-- Narrow screens only: the menu, the name, the search. -->
      <div class="app__bar">
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          aria-label="Open the guide"
          @click="open = true"
        />
        <NuxtLink
          to="/"
          class="min-w-0"
        >
          <AppLogo compact />
        </NuxtLink>
        <UButton
          icon="i-lucide-search"
          color="neutral"
          variant="ghost"
          aria-label="Search the guide"
          @click="openSearch = true"
        />
      </div>

      <!-- Wide screens: the fold-away control, pinned to the corner. -->
      <UTooltip
        :text="collapsed ? 'Show the guide' : 'Hide the guide'"
        :kbds="['[']"
      >
        <UButton
          :icon="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="collapsed ? 'Show the guide' : 'Hide the guide'"
          class="app__fold"
          @click="toggle"
        />
      </UTooltip>

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
  --ui-header-height: 0px;
  min-height: 100vh;
}

.app__sidebar {
  display: none;
}

.app__main {
  position: relative;
  min-width: 0;
}

.app__bar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  height: 3.5rem;
  padding-inline: 0.5rem;
  border-bottom: 1px solid var(--ui-border);
  background: color-mix(in oklab, var(--ui-bg) 88%, transparent);
  backdrop-filter: blur(10px);
}

.app__fold {
  display: none;
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

  .app__bar {
    display: none;
  }

  .app__fold {
    display: inline-flex;
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 10;
  }

  .app[data-sidebar='collapsed'] .app__sidebar {
    transform: translateX(-100%);
  }

  .app[data-sidebar='collapsed'] .app__main {
    margin-left: 0;
  }
}
</style>
