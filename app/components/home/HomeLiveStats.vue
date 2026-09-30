<script setup lang="ts">
/**
 * The live numbers on the home page, from GET /api/stats/summary, with
 * /api/stats/details for where the readers are.
 *
 * Browser only, because the page is prerendered and a number baked into the
 * HTML is stale the moment it is deployed. Every figure is shown, zeros
 * included: the site is live, and "0 stories" is a true thing to say on the
 * first day. Only a failed request hides the strip, because then there is no
 * number to be honest about.
 */
interface Summary {
  visitors?: number
  pageViews?: number
  liveNow?: number
  countries?: number
  stories?: number
  jobsGot?: number
  raised?: number
}

interface Details {
  countries?: { country: string, visitors: number }[]
}

const summary = ref<Summary | null>(null)
const details = ref<Details | null>(null)
const state = ref<'loading' | 'ready' | 'failed'>('loading')

onMounted(async () => {
  const [s, d] = await Promise.allSettled([
    $fetch<Summary>('/api/stats/summary', { timeout: 6000 }),
    $fetch<Details>('/api/stats/details', { timeout: 6000 })
  ])
  summary.value = s.status === 'fulfilled' ? s.value : null
  details.value = d.status === 'fulfilled' ? d.value : null
  state.value = summary.value ? 'ready' : 'failed'
})

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const n = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0

const figures = computed(() => {
  const s = summary.value || {}
  const countries = n(s.countries) || details.value?.countries?.length || 0
  return [
    { key: 'live', label: 'Reading now', text: formatCount(n(s.liveNow)), icon: 'i-lucide-radio', live: true },
    { key: 'visitors', label: 'Readers so far', text: formatCount(n(s.visitors)), icon: 'i-lucide-users' },
    { key: 'views', label: 'Pages read', text: formatCount(n(s.pageViews)), icon: 'i-lucide-eye' },
    { key: 'countries', label: 'Countries', text: formatCount(countries), icon: 'i-lucide-globe' },
    { key: 'stories', label: 'Stories shared', text: formatCount(n(s.stories)), icon: 'i-lucide-message-square-heart' },
    { key: 'jobs', label: 'Got a job', text: formatCount(n(s.jobsGot)), icon: 'i-lucide-briefcase' },
    // `raised` is in paise.
    { key: 'raised', label: 'Raised', text: money.format(n(s.raised) / 100), icon: 'i-lucide-heart' }
  ]
})

/** The three countries with the most readers, as flags. */
const topCountries = computed(() => (details.value?.countries || []).slice(0, 3))
</script>

<template>
  <div
    v-if="state !== 'failed'"
    class="strip"
  >
    <dl
      class="strip__grid"
      aria-label="Live numbers"
      :aria-busy="state === 'loading'"
    >
      <div
        v-for="figure in figures"
        :key="figure.key"
        class="strip__item"
        :data-live="figure.live ? '' : undefined"
      >
        <dt class="strip__label">
          <span
            v-if="figure.live"
            class="strip__pulse"
            aria-hidden="true"
          />
          <UIcon
            v-else
            :name="figure.icon"
            class="size-3.5 shrink-0"
          />
          {{ figure.label }}
        </dt>
        <dd class="strip__value">
          <USkeleton
            v-if="state === 'loading'"
            class="h-6 w-12"
          />
          <template v-else>
            {{ figure.text }}
          </template>
        </dd>
      </div>
    </dl>

    <p class="strip__foot">
      <span v-if="topCountries.length">
        Most readers from
        <span
          v-for="(c, i) in topCountries"
          :key="c.country"
        >{{ i ? ', ' : ' ' }}{{ countryFlag(c.country) }} {{ countryName(c.country) }}</span>.
      </span>
      <NuxtLink
        to="/stats"
        class="strip__link"
      >
        All the numbers, live
        <UIcon
          name="i-lucide-arrow-right"
          class="size-3.5"
        />
      </NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.strip__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--ui-border);
  border-left: 1px solid var(--ui-border);
}

@media (min-width: 640px) {
  .strip__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .strip__grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
}

.strip__item {
  min-width: 0;
  padding: 0.75rem 0.875rem;
  border-right: 1px solid var(--ui-border);
  border-bottom: 1px solid var(--ui-border);
  background: var(--ui-bg);
}

.strip__item[data-live] {
  background: color-mix(in oklab, var(--ui-success) 7%, var(--ui-bg));
}

.strip__label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--text-xs);
  color: var(--ui-text-dimmed);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.strip__value {
  margin-top: 0.25rem;
  min-height: 1.5rem;
  font-family: var(--font-pixel);
  font-size: 1.5rem;
  line-height: 1.1;
  color: var(--ui-text-highlighted);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.strip__pulse {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--ui-success);
  box-shadow: 0 0 0 0 color-mix(in oklab, var(--ui-success) 60%, transparent);
  animation: pulse 1.8s var(--dgm-ease) infinite;
}

@keyframes pulse {
  70% {
    box-shadow: 0 0 0 6px transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .strip__pulse {
    animation: none;
  }
}

.strip__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-top: 0.75rem;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
}

.strip__link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.strip__link:hover {
  color: var(--ui-primary);
}
</style>
