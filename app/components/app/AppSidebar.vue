<script setup lang="ts">
import { footLinks } from '~/utils/links'

/**
 * The guide, as one line you travel down.
 *
 * Where you left off at the top, then the timeline of every track (see
 * PlayerRail), then one quiet row of small links and the colour-mode switch.
 * The brand, the search and the community pages live in the top bar.
 */
defineProps<{
  current?: string
  /** Rendered inside the phone drawer rather than the fixed column. */
  drawer?: boolean
}>()

const emit = defineEmits<{ navigate: [] }>()

const { path } = usePath()
const { state, pathProgress, resume } = useProgress()

const progress = computed(() => pathProgress(path.value))
const next = computed(() => resume(path.value))
</script>

<template>
  <div
    class="sidebar"
    :data-drawer="drawer || undefined"
  >
    <div class="sidebar__scroll">
      <ClientOnly>
        <NuxtLink
          v-if="next"
          :to="next.path"
          class="sidebar__continue row-link"
          @click="emit('navigate')"
        >
          <span class="label">
            <span class="mark" />
            {{ state.lastVisited ? 'Continue' : 'Start here' }}
          </span>
          <span class="sidebar__continue-title">{{ next.title }}</span>
          <span
            v-if="progress.started"
            class="sidebar__progress"
            :style="{ '--pct': `${progress.percent}%` }"
          >
            <span class="sidebar__progress-line" />
            <span class="sidebar__progress-text num">{{ progress.completed }} of {{ progress.total }} · {{ progress.percent }}%</span>
          </span>
        </NuxtLink>

        <template #fallback>
          <NuxtLink
            to="/bangalore"
            class="sidebar__continue row-link"
          >
            <span class="label"><span class="mark" /> Start here</span>
            <span class="sidebar__continue-title">Moving to Bangalore</span>
          </NuxtLink>
        </template>
      </ClientOnly>

      <PlayerRail
        :current="current"
        class="sidebar__rail"
        @navigate="emit('navigate')"
      />
    </div>

    <footer class="sidebar__foot">
      <nav
        class="sidebar__links"
        aria-label="About this site"
      >
        <template
          v-for="(link, index) in footLinks"
          :key="link.label"
        >
          <span
            v-if="index"
            aria-hidden="true"
          >·</span>
          <NuxtLink
            :to="link.to"
            :target="link.target"
            class="sidebar__link"
            @click="emit('navigate')"
          >
            {{ link.label }}
          </NuxtLink>
        </template>
      </nav>

      <UColorModeButton
        size="xs"
        color="neutral"
        variant="ghost"
      />
    </footer>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: var(--sidebar-w);
  height: 100%;
  background: var(--ui-bg);
}

.sidebar[data-drawer] {
  width: 100%;
}

.sidebar__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.sidebar__continue {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1rem 0.875rem 1.25rem;
  border-bottom: 1px solid var(--rule-color);
}

.sidebar__continue-title {
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.3;
  color: var(--ui-text-highlighted);
}

.sidebar__progress {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 0.375rem;
}

/* A hairline with the finished part drawn over it in ink. */
.sidebar__progress-line {
  position: relative;
  display: block;
  height: 1px;
  background: var(--rule-color);
}

.sidebar__progress-line::after {
  content: '';
  position: absolute;
  left: 0;
  top: -1px;
  height: 3px;
  width: var(--pct);
  background: var(--ui-primary);
  transition: width var(--dgm-t-base) var(--dgm-ease);
}

.sidebar__progress-text {
  font-size: var(--text-xs);
  color: var(--ui-text-dimmed);
}

.sidebar__rail {
  padding-block: 0.75rem 1.5rem;
}

.sidebar__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex: none;
  padding: 0.375rem 0.5rem 0.375rem 1.25rem;
  border-top: 1px solid var(--rule-color);
}

.sidebar__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.125rem 0.375rem;
  font-size: 0.75rem;
  color: var(--ui-text-dimmed);
}

.sidebar__link {
  color: var(--ui-text-muted);
  transition: color var(--dgm-t-fast) var(--dgm-ease);
}

.sidebar__link:hover {
  color: var(--ui-text-highlighted);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
