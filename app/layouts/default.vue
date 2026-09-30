<script setup lang="ts">
import { PANE_ID, rememberPane } from '~/utils/pane'

/**
 * The app: a fixed viewport, like a desktop application rather than a long
 * web page.
 *
 *   ┌──────────────────────────── top bar ───────────────────────────┐
 *   │ sidebar (fixed)  │ content pane (the only thing that scrolls)  │
 *   │                  │                                             │
 *   └──────────────────┴─────────────────────────────────────────────┘
 *
 * The document never scrolls. The sidebar folds away on a wide screen (and
 * remembers it); on a phone it is a drawer over the page. Every scroll the app
 * makes goes to the pane: see utils/pane.ts and router.options.ts.
 */
const route = useRoute()
const router = useRouter()
const { isNarrow, open, collapsed, toggle, close } = useRail()
const { open: openSearch } = useContentSearch()

defineShortcuts({
  '/': () => {
    openSearch.value = true
  },
  '[': () => toggle()
})

watch(() => route.path, close)

// The folded state lives in localStorage, which the prerendered HTML cannot
// know. Apply it once mounted, so hydration matches and the change patches.
const mounted = useMounted()
const folded = computed(() => mounted.value && collapsed.value)

// Hand the pre-mount CSS fold (see the style block) back to the component.
onMounted(async () => {
  await nextTick()
  document.documentElement.removeAttribute('data-sidebar-init')
})

const pane = useTemplateRef<HTMLElement>('pane')

// Remember where the pane was before leaving, so Back can return there.
const stopRemembering = router.beforeEach((_to, from) => {
  if (pane.value) {
    rememberPane(from.fullPath, pane.value.scrollTop)
  }
})
onBeforeUnmount(stopRemembering)
</script>

<template>
  <div
    class="app"
    :data-sidebar="folded ? 'collapsed' : undefined"
  >
    <a
      :href="`#${PANE_ID}`"
      class="app__skip"
    >Skip to the content</a>

    <AppNavbar class="app__navbar" />

    <div class="app__body">
      <aside
        class="app__sidebar"
        aria-label="The guide"
        :inert="folded || undefined"
      >
        <AppSidebar :current="route.path" />
      </aside>

      <main
        :id="PANE_ID"
        ref="pane"
        class="app__pane"
        tabindex="-1"
      >
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
        description="Every track, in order, and where you are in it."
      >
        <template #content>
          <AppSidebar
            :current="route.path"
            drawer
            @navigate="close"
          />
        </template>
      </USlideover>
    </ClientOnly>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--ui-bg);
}

.app__skip {
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  z-index: 60;
  padding: 0.5rem 0.75rem;
  background: var(--ui-text-highlighted);
  color: var(--ui-bg);
  font-size: var(--text-sm);
  font-weight: 600;
  transform: translateY(-200%);
}

.app__skip:focus-visible {
  transform: none;
}

.app__navbar {
  flex: none;
}

.app__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.app__sidebar {
  display: none;
}

/* The pane. `--ui-header-height` is zero inside it: the bar is outside the
   scroller, so Nuxt UI's sticky tables of contents and heading scroll margins
   measure from the pane's own top edge. */
.app__pane {
  --ui-header-height: 0px;
  position: relative;
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-padding-top: 1rem;
  scrollbar-gutter: stable;
  outline: none;
}

@media (min-width: 1024px) {
  .app__sidebar {
    display: block;
    flex: none;
    width: var(--sidebar-w);
    overflow: hidden;
    border-right: 1px solid var(--rule-color);
    transition:
      width var(--dgm-t-base) var(--dgm-ease),
      visibility 0s linear 0s;
  }

  .app[data-sidebar='collapsed'] .app__sidebar {
    width: 0;
    border-right-width: 0;
    visibility: hidden;
    transition:
      width var(--dgm-t-base) var(--dgm-ease),
      visibility 0s linear var(--dgm-t-base);
  }

  /* Before Vue mounts, an inline script in app.vue marks <html> when the
     reader had folded the sidebar, so a reload never flashes it open. Once
     the component takes over (`data-sidebar` appears) this rule stands down. */
  html[data-sidebar-init='collapsed'] .app:not([data-sidebar]) .app__sidebar {
    width: 0;
    border-right-width: 0;
    visibility: hidden;
    transition: none;
  }
}
</style>
