<script setup lang="ts">
import { footLinks } from '~/utils/links'

/**
 * The whole app's navigation, and the only navigation there is.
 *
 * There is no header and no footer menu. A reader is always in one of two
 * places: somewhere in the guide, or searching for somewhere in it. So the
 * sidebar carries the brand, the search, where you left off, and the guide
 * itself in order. Everything else (privacy, terms, contact) is a line of small
 * links at the foot, because it is needed once.
 */
defineProps<{
  current?: string
}>()

const emit = defineEmits<{ navigate: [] }>()

const { path } = usePath()
const { state, pathProgress, resume } = useProgress()
const { open: openSearch } = useContentSearch()

const progress = computed(() => pathProgress(path.value))
const next = computed(() => resume(path.value))

function search() {
  emit('navigate')
  openSearch.value = true
}
</script>

<template>
  <!-- One scroll for the whole sidebar, not a scrolling box inside it: the
       brand and search scroll away, the rail follows, and the sponsor spot is
       pinned to the bottom edge until its own place arrives, just above the
       red band that ends the sidebar. -->
  <div class="sidebar flex flex-col h-full overflow-y-auto overscroll-contain">
    <div class="px-3 pt-4 pb-3">
      <NuxtLink
        to="/"
        class="block rounded-md px-1 py-1 -mx-1"
        aria-label="Bangalore Job Seekers Guide, home"
        @click="emit('navigate')"
      >
        <AppLogo />
      </NuxtLink>

      <button
        type="button"
        class="search-button mt-4"
        @click="search"
      >
        <UIcon
          name="i-lucide-search"
          class="size-4 shrink-0"
        />
        <span class="flex-1 text-left">Search the guide</span>
        <UKbd value="/" />
      </button>

      <ClientOnly>
        <div class="mt-4 space-y-3">
          <NuxtLink
            v-if="next"
            :to="next.path"
            class="continue card-hover"
            @click="emit('navigate')"
          >
            <UIcon
              name="i-lucide-play"
              class="size-3.5 text-primary shrink-0"
            />
            <span class="min-w-0">
              <span class="block text-[0.6875rem] uppercase tracking-wider text-dimmed">
                {{ state.lastVisited ? 'Continue' : 'Start here' }}
              </span>
              <span class="block truncate text-sm text-highlighted">{{ next.title }}</span>
            </span>
          </NuxtLink>

          <PlayerProgress
            v-if="progress.started"
            :progress="progress"
          />
        </div>
      </ClientOnly>
    </div>

    <div class="flex-1 px-3 pb-6 border-t border-default pt-4">
      <NuxtLink
        to="/"
        class="home-link"
        :class="current === '/' && 'home-link--active'"
        @click="emit('navigate')"
      >
        <UIcon
          name="i-lucide-house"
          class="size-4 shrink-0"
        />
        Home
      </NuxtLink>

      <PlayerRail
        :current="current"
        class="mt-4"
        @navigate="emit('navigate')"
      />
    </div>

    <div class="sidebar__sponsor">
      <SponsorSlot
        name="sidebar"
        variant="compact"
      />
    </div>

    <!-- The sidebar ends in red: the one ask this app makes, said once, at the
         bottom of the only navigation there is. -->
    <div class="support">
      <p class="support__title">
        <UIcon
          name="i-lucide-heart-handshake"
          class="size-4 shrink-0"
        />
        Support this guide
      </p>
      <p class="support__text">
        Free, no paywall. If it helped you, help it stay that way.
      </p>

      <div class="mt-3 flex flex-wrap gap-2">
        <NuxtLink
          to="/support"
          class="support__button support__button--solid"
          @click="emit('navigate')"
        >
          Support
        </NuxtLink>
        <NuxtLink
          to="/sponsor"
          class="support__button"
          @click="emit('navigate')"
        >
          Become a sponsor
        </NuxtLink>
      </div>

      <div class="support__foot">
        <div class="flex flex-wrap gap-x-3 gap-y-1">
          <NuxtLink
            v-for="link in footLinks"
            :key="link.label"
            :to="link.to"
            :target="link.target"
            class="support__link"
            @click="emit('navigate')"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <UColorModeButton
          size="xs"
          color="neutral"
          variant="ghost"
          class="support__mode"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  scrollbar-width: thin;
}

/* Sticks to the bottom of the sidebar while the rail scrolls under it. */
.sidebar__sponsor {
  position: sticky;
  bottom: 0;
  z-index: 5;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--ui-border);
  background: var(--ui-bg);
}

/* A fixed red, not `--ui-primary`: in dark mode the primary lightens to a
   pink that white text cannot sit on. 700 carries small white text at a
   comfortable contrast in both modes. */
.support {
  padding: 0.875rem 1rem 0.75rem;
  color: #fff;
  background:
    radial-gradient(16rem 8rem at 0% 0%, rgb(255 255 255 / 0.14), transparent 70%),
    linear-gradient(160deg, var(--color-guide-600), var(--color-guide-800));
}

.support__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9375rem;
}

.support__text {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: rgb(255 255 255 / 0.88);
}

.support__button {
  display: inline-flex;
  align-items: center;
  padding: 0.3125rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid rgb(255 255 255 / 0.55);
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
  transition: background-color var(--dgm-t-fast) var(--dgm-ease);
}

.support__button:hover {
  background: rgb(255 255 255 / 0.14);
}

.support__button--solid {
  border-color: #fff;
  background: #fff;
  color: var(--color-guide-700);
}

.support__button--solid:hover {
  background: rgb(255 255 255 / 0.9);
}

.support__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.625rem;
  border-top: 1px solid rgb(255 255 255 / 0.22);
}

.support__link {
  font-size: 0.75rem;
  color: rgb(255 255 255 / 0.85);
  transition: color var(--dgm-t-fast) var(--dgm-ease);
}

.support__link:hover {
  color: #fff;
  text-decoration: underline;
}

.support__mode {
  color: #fff;
}

.support__mode:hover {
  background: rgb(255 255 255 / 0.16);
}

.search-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-md);
  background: var(--ui-bg);
  color: var(--ui-text-dimmed);
  font-size: 0.875rem;
  transition: border-color var(--dgm-t-fast) var(--dgm-ease), color var(--dgm-t-fast) var(--dgm-ease);
}

.search-button:hover {
  border-color: var(--ui-text-highlighted);
  color: var(--ui-text-highlighted);
  box-shadow: 3px 3px 0 0 var(--ui-primary);
}

.continue {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-left: 3px solid var(--ui-primary);
  background: var(--ui-bg-elevated);
}

.home-link {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ui-text-muted);
  transition: background-color var(--dgm-t-fast) var(--dgm-ease), color var(--dgm-t-fast) var(--dgm-ease);
}

.home-link:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.home-link--active {
  color: var(--ui-primary);
  background: color-mix(in oklab, var(--ui-primary) 10%, transparent);
}
</style>
