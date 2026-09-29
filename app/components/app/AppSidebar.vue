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
  <div class="flex flex-col h-full">
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
            class="continue"
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

    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-6 border-t border-default pt-4">
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

    <div class="px-4 py-3 border-t border-default flex items-center justify-between gap-2">
      <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-dimmed">
        <NuxtLink
          v-for="link in footLinks"
          :key="link.label"
          :to="link.to"
          :target="link.target"
          class="hover:text-highlighted transition-colors"
          @click="emit('navigate')"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <UColorModeButton size="xs" />
    </div>
  </div>
</template>

<style scoped>
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
  border-color: var(--ui-border-accented);
  color: var(--ui-text-highlighted);
}

.continue {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-md);
  background: var(--ui-bg-elevated);
  transition: background-color var(--dgm-t-fast) var(--dgm-ease);
}

.continue:hover {
  background: var(--ui-bg-accented);
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
