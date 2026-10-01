<script setup lang="ts">
import { footLinks } from '~/utils/links'

/**
 * The guide, as one line you travel down.
 *
 * Where you left off at the top, then the timeline of every track (see
 * PlayerRail), the site sponsor's card when there is one, then one quiet row
 * of small links and the colour-mode switch.
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

/** The method, in three lines. Static on purpose: it never changes. */
const how = [
  'Read in order',
  'Run the code, do the exercises',
  'Mark finished, then share your story'
]

/**
 * The little pulse under the timeline: the last fortnight of readers as a
 * sparkline, the totals, and the one quiet ask. Fetched in the browser only
 * (both endpoints are edge-cached), and the whole block hides when either
 * call fails: a sidebar never shows an error.
 */
interface Pulse {
  days: number[]
  readers: number
  raised: number
}

const pulse = ref<Pulse | null>(null)

onMounted(async () => {
  try {
    const [trend, summary] = await Promise.all([
      $fetch<{ days: { visitors: number }[] }>('/api/stats/trend?days=30', { timeout: 6000 }),
      $fetch<{ visitors: number, raised: number }>('/api/stats/summary', { timeout: 6000 })
    ])
    pulse.value = {
      days: trend.days.slice(-14).map(day => day.visitors),
      readers: summary.visitors,
      raised: summary.raised
    }
  } catch {
    pulse.value = null
  }
})

/** The fortnight, as polyline points on a 100×28 canvas. */
const spark = computed(() => {
  const days = pulse.value?.days ?? []
  if (days.length < 2) {
    return ''
  }
  const top = Math.max(...days, 1)
  return days
    .map((value, index) => {
      const x = (index / (days.length - 1)) * 100
      const y = 26 - (value / top) * 24
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

const count = new Intl.NumberFormat('en-IN')
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
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

      <!-- The site sponsor, as the square. Only when somebody holds the spot:
           an open spot shows nothing here, the pages carry that invitation. -->
      <SponsorSlot
        name="brand"
        format="square"
        hide-empty
        class="sidebar__sponsor"
        @click="emit('navigate')"
      />

      <section
        class="sidebar__how"
        aria-label="How this guide works"
      >
        <h2 class="label">
          How this works
        </h2>
        <ol class="sidebar__steps">
          <li
            v-for="(step, index) in how"
            :key="step"
          >
            <span class="sidebar__step-n num">{{ String(index + 1).padStart(2, '0') }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
      </section>

      <ClientOnly>
        <section
          v-if="pulse"
          class="sidebar__pulse"
          aria-label="Readers of this guide"
        >
          <h2 class="label">
            <span
              class="mark"
              data-live
            /> Last 14 days
          </h2>
          <svg
            v-if="spark"
            class="sidebar__spark"
            viewBox="0 0 100 28"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <polyline :points="spark" />
          </svg>
          <dl class="sidebar__pulse-facts num">
            <div>
              <dt>readers so far</dt>
              <dd>{{ count.format(pulse.readers) }}</dd>
            </div>
            <div>
              <dt>raised</dt>
              <dd>{{ money.format(pulse.raised / 100) }}</dd>
            </div>
          </dl>
          <NuxtLink
            to="/sponsor#support"
            class="arrow-link sidebar__support"
            @click="emit('navigate')"
          >
            Support this guide
            <UIcon
              name="i-lucide-arrow-right"
              class="size-3.5"
            />
          </NuxtLink>
        </section>
      </ClientOnly>
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

/* ── The quiet blocks under the timeline ─────────────────────────────── */
.sidebar__sponsor,
.sidebar__how,
.sidebar__pulse {
  padding: 0.875rem 1rem 1rem 1.25rem;
  border-top: 1px solid var(--rule-color);
}

.sidebar__steps {
  margin-top: 0.625rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.sidebar__steps li {
  display: flex;
  gap: 0.625rem;
  font-size: var(--text-xs);
  line-height: 1.4;
  color: var(--ui-text-muted);
}

.sidebar__step-n {
  flex: none;
  font-weight: 600;
  color: var(--ui-text-dimmed);
}

.sidebar__spark {
  display: block;
  width: 100%;
  height: 1.75rem;
  margin-top: 0.625rem;
  overflow: visible;
}

.sidebar__spark polyline {
  fill: none;
  stroke: var(--ui-text-highlighted);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.sidebar__pulse-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 0.625rem;
  border-top: 1px solid var(--rule-color);
}

.sidebar__pulse-facts > div {
  padding: 0.5rem 0.5rem 0 0;
}

.sidebar__pulse-facts > div + div {
  padding-left: 0.625rem;
  border-left: 1px solid var(--rule-color);
}

.sidebar__pulse-facts dt {
  font-size: 0.6875rem;
  color: var(--ui-text-dimmed);
}

.sidebar__pulse-facts dd {
  margin-top: 0.125rem;
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ui-text-highlighted);
}

.sidebar__support {
  margin-top: 0.75rem;
  font-size: var(--text-xs);
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
