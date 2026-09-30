<script setup lang="ts">
/**
 * The live numbers on the home page, from GET /api/stats/summary, with
 * /api/stats/details for where the readers are.
 *
 * Pages read is the headline, set as large as anything on the page: it is the
 * one number that says this is being used. The rest sit beside it in a ruled
 * table. Browser only, because the page is prerendered and a number baked
 * into the HTML is stale the moment it is deployed. Zeros are shown: "0
 * stories" is a true thing to say on the first day. Only a failed request
 * hides the block, because then there is no number to be honest about.
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
const whole = new Intl.NumberFormat('en-IN')
const n = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0

const pageViews = computed(() => whole.format(n(summary.value?.pageViews)))

const figures = computed(() => {
  const s = summary.value || {}
  const countries = n(s.countries) || details.value?.countries?.length || 0
  return [
    { key: 'live', label: 'Reading now', text: formatCount(n(s.liveNow)), live: true },
    { key: 'visitors', label: 'Readers so far', text: formatCount(n(s.visitors)) },
    { key: 'countries', label: 'Countries', text: formatCount(countries) },
    { key: 'stories', label: 'Stories shared', text: formatCount(n(s.stories)) },
    { key: 'jobs', label: 'Got a job', text: formatCount(n(s.jobsGot)) },
    // `raised` is in paise.
    { key: 'raised', label: 'Raised', text: money.format(n(s.raised) / 100) }
  ]
})

/** The three countries with the most readers. */
const topCountries = computed(() => (details.value?.countries || []).slice(0, 3))
</script>

<template>
  <div
    v-if="state !== 'failed'"
    class="live swiss-grid"
    :aria-busy="state === 'loading'"
  >
    <div class="live__lead">
      <p class="label">
        Pages read, all time
      </p>
      <p class="live__big num">
        <USkeleton
          v-if="state === 'loading'"
          class="h-[0.9em] w-[4ch]"
        />
        <template v-else>
          {{ pageViews }}
        </template>
      </p>
    </div>

    <dl class="live__grid">
      <div
        v-for="figure in figures"
        :key="figure.key"
        class="live__item"
      >
        <dt class="label">
          <span
            v-if="figure.live"
            class="mark"
            data-live
            aria-hidden="true"
          />
          {{ figure.label }}
        </dt>
        <dd class="live__value num">
          <USkeleton
            v-if="state === 'loading'"
            class="h-7 w-14"
          />
          <template v-else>
            {{ figure.text }}
          </template>
        </dd>
      </div>
    </dl>

    <p class="live__foot">
      <span v-if="topCountries.length">
        Most readers from<span
          v-for="(c, i) in topCountries"
          :key="c.country"
        >{{ i ? ', ' : ' ' }}{{ countryFlag(c.country) }} {{ countryName(c.country) }}</span>.
      </span>
      <NuxtLink
        to="/stats"
        class="arrow-link"
      >
        All the numbers, live
        <UIcon
          name="i-lucide-arrow-right"
          class="size-4"
        />
      </NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.live > * {
  grid-column: 1 / -1;
  min-width: 0;
}

.live__lead {
  container-type: inline-size;
}

/* Sized to the column it sits in, not the window, so a seven-figure number
   never runs into the table beside it. */
.live__big {
  margin-top: 0.5rem;
  font-size: clamp(3rem, 17cqi, 8rem);
  line-height: 0.9;
  font-weight: 700;
  letter-spacing: -0.06em;
  color: var(--ui-text-highlighted);
  overflow-wrap: anywhere;
}

.live__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 2.5rem;
  border-top: 1px solid var(--rule-color);
}

.live__item {
  min-width: 0;
  padding: 0.75rem 0.75rem 1rem 0;
  border-bottom: 1px solid var(--rule-color);
}

.live__item:nth-child(even) {
  padding-left: 0.75rem;
  border-left: 1px solid var(--rule-color);
}

.live__value {
  margin-top: 0.5rem;
  min-height: 1.75rem;
  font-size: 1.75rem;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--ui-text-highlighted);
  overflow-wrap: anywhere;
}

.live__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  margin-top: 1.25rem;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
}

@media (min-width: 640px) {
  .live__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .live__item:nth-child(even) {
    padding-left: 0;
    border-left: 0;
  }

  .live__item:not(:nth-child(3n + 1)) {
    padding-left: 0.75rem;
    border-left: 1px solid var(--rule-color);
  }
}

@media (min-width: 1024px) {
  .live__lead {
    grid-column: 1 / span 6;
    align-self: end;
  }

  .live__grid {
    grid-column: 7 / -1;
    margin-top: 0;
  }
}
</style>
