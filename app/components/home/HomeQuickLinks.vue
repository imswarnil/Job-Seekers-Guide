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
      v-for="(tile, index) in tiles"
      :key="tile.key"
    >
      <NuxtLink
        :to="tile.to"
        class="quick__row row-link"
        :data-primary="tile.primary ? '' : undefined"
        :style="tile.track ? { '--track': trackStyle(tile.track).color } : undefined"
      >
        <span class="quick__n num">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="quick__main">
          <span class="quick__label">
            <span
              v-if="tile.track"
              class="quick__swatch"
              aria-hidden="true"
            />
            {{ tile.label }}
          </span>
          <span class="quick__note">{{ tile.note }}</span>
        </span>
        <UIcon
          name="i-lucide-arrow-right"
          class="quick__arrow size-4"
        />
      </NuxtLink>
    </li>
  </ul>
</template>

<style scoped>
/* An index: numbered rows between rules, in two columns once there is room.
   The rules run the full width of each column, so the two lists read as one
   table. */
.quick {
  display: grid;
  column-gap: var(--gutter);
  border-top: 1px solid var(--rule-color);
}

.quick > li {
  border-bottom: 1px solid var(--rule-color);
}

@media (min-width: 768px) {
  .quick {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.quick__row {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: baseline;
  height: 100%;
  padding: 0.875rem 0.5rem 0.875rem 0;
}

.quick__n {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--ui-text-dimmed);
}

.quick__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.quick__label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.25;
  color: var(--ui-text-highlighted);
}

.quick__row[data-primary] .quick__label,
.quick__row:hover .quick__label {
  color: var(--ui-primary);
}

.quick__swatch {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  background: var(--track);
}

.quick__note {
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
}

.quick__arrow {
  align-self: center;
  color: var(--ui-text-dimmed);
  transition:
    transform var(--dgm-t-fast) var(--dgm-ease),
    color var(--dgm-t-fast) var(--dgm-ease);
}

.quick__row:hover .quick__arrow {
  color: var(--ui-primary);
  transform: translateX(3px);
}

@media (prefers-reduced-motion: reduce) {
  .quick__row:hover .quick__arrow {
    transform: none;
  }
}
</style>
