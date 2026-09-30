<script setup lang="ts">
import { trackStyle } from '~/utils/tech'

/**
 * The places people come back for, one click each. The first tile is either
 * "Start the guide" or, once you have been reading, "Continue" with the lesson
 * you left off on.
 */
const { path } = usePath()
const { state, resume } = useProgress()

const next = computed(() => resume(path.value))

// Progress lives in this browser. Until the page has hydrated, render what the
// prerendered HTML has (no "Continue"), so the two agree.
const mounted = useMounted()

interface Tile {
  key: string
  label: string
  note: string
  to: string
  icon: string
  /** A track slug, for its colour. */
  track?: string
  primary?: boolean
}

const fixed: Tile[] = [
  { key: 'java', label: 'Java', note: 'The language most freshers are hired for', to: '/java', icon: 'i-simple-icons-openjdk', track: 'java' },
  { key: 'dsa', label: 'DSA', note: 'The coding round, pattern by pattern', to: '/dsa', icon: 'i-lucide-binary', track: 'dsa' },
  { key: 'sql', label: 'SQL', note: 'Asked in almost every interview', to: '/sql', icon: 'i-lucide-database', track: 'sql' },
  { key: 'written', label: 'Written round', note: 'Where I was rejected most', to: '/quantitative-aptitude', icon: 'i-lucide-clipboard-list', track: 'quantitative-aptitude' },
  { key: 'tmay', label: 'Tell me about yourself', note: 'The first answer decides the rest', to: '/interview/tell-me-about-yourself', icon: 'i-lucide-mic', track: 'interview' },
  { key: 'stories', label: 'Stories', note: 'How other people got their first job', to: '/stories', icon: 'i-lucide-message-square-heart' },
  { key: 'guestbook', label: 'Guestbook', note: 'Say hello, and what you learned', to: '/guestbook', icon: 'i-lucide-book-open-text' },
  { key: 'stats', label: 'Live stats', note: 'Who is reading, from where', to: '/stats', icon: 'i-lucide-chart-column' }
]

const tiles = computed<Tile[]>(() => {
  const started = mounted.value && Boolean(state.value.lastVisited && next.value)
  const first: Tile[] = [
    { key: 'start', label: 'Start the guide', note: 'From the train to Bangalore onwards', to: '/bangalore', icon: 'i-lucide-train-front', primary: !started }
  ]
  if (started && next.value) {
    first.push({ key: 'continue', label: 'Continue', note: next.value.title, to: next.value.path, icon: 'i-lucide-play', primary: true })
  }
  return [...first, ...fixed]
})
</script>

<template>
  <ul class="quick">
    <li
      v-for="tile in tiles"
      :key="tile.key"
    >
      <NuxtLink
        :to="tile.to"
        class="quick__tile card-hover"
        :data-primary="tile.primary ? '' : undefined"
        :style="tile.track ? { '--track': trackStyle(tile.track).color } : undefined"
      >
        <span class="quick__icon">
          <UIcon
            :name="tile.icon"
            class="size-5"
          />
        </span>
        <span class="min-w-0">
          <span class="quick__label">{{ tile.label }}</span>
          <span class="quick__note">{{ tile.note }}</span>
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>

<style scoped>
.quick {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 14.5rem), 1fr));
}

.quick__tile {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  height: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid var(--ui-border);
  background: var(--ui-bg);
}

.quick__tile[data-primary] {
  border-color: var(--ui-primary);
  background: color-mix(in oklab, var(--ui-primary) 6%, var(--ui-bg));
}

.quick__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  color: var(--track, var(--ui-primary));
  background: color-mix(in oklab, var(--track, var(--ui-primary)) 12%, transparent);
}

.dark .quick__icon {
  color: color-mix(in oklab, var(--track, var(--ui-primary)) 70%, white);
}

.quick__label {
  display: block;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.quick__note {
  display: -webkit-box;
  margin-top: 0.125rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: var(--text-sm);
  line-height: 1.4;
  color: var(--ui-text-muted);
}
</style>
