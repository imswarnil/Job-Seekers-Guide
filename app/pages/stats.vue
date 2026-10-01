<script setup lang="ts">
/**
 * The public numbers, all of them. Counted on this site's own server, with no
 * third-party analytics: a random cookie id per browser, the page, the
 * referring site and the country. That is the whole list.
 *
 * Headline totals from /api/stats/summary, the daily trend (visitors, page
 * views, new accounts) from /api/stats/trend for a chosen range, and the top
 * pages and countries from /api/stats/details. All fetched in the browser, so
 * the prerendered page is never out of date.
 */
interface Summary {
  visitors: number
  pageViews: number
  liveNow: number
  countries: number
  stories: number
  jobsGot: number
  guestbook: number
  raised: number
  sponsors: number
}

interface Details {
  countries: { country: string, visitors: number }[]
  topPages: { path: string, views: number }[]
}

interface Trend {
  range: number
  totals: { visitors: number, views: number, signups: number, raised: number }
  days: { day: string, visitors: number, views: number, signups: number, raised: number }[]
}

const RANGES = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' }
] as const

const range = ref<30 | 90 | 365>(30)

const { data: summary, status } = useFetch<Summary>('/api/stats/summary', { server: false, lazy: true })
const { data: details, status: detailsStatus } = useFetch<Details>('/api/stats/details', { server: false, lazy: true })
const { data: trend, status: trendStatus } = useFetch<Trend>('/api/stats/trend', {
  server: false,
  lazy: true,
  query: { days: range }
})

const loading = computed(() => status.value === 'pending' || status.value === 'idle')

const numbers = computed(() => {
  const s = summary.value
  const f = (v: number | undefined) => (s ? formatCount(v) : '–')
  return [
    { label: 'Page views', value: f(s?.pageViews), note: 'Every page read, all time' },
    { label: 'Unique visitors', value: f(s?.visitors), note: 'Browsers, not people' },
    { label: 'Reading now', value: f(s?.liveNow), note: 'In the last five minutes', live: Boolean(s?.liveNow) },
    { label: 'Countries', value: f(s?.countries), note: 'Where readers are' },
    { label: 'Stories', value: f(s?.stories), note: 'Shared by readers' },
    { label: 'Jobs got', value: f(s?.jobsGot), note: 'Readers who said so' },
    { label: 'Raised', value: s ? formatPaise(s.raised) : '–', note: 'Gifts and sponsors' },
    { label: 'Sponsors', value: f(s?.sponsors), note: 'All time' }
  ]
})

const days = computed(() => trend.value?.days.map(d => d.day) ?? [])
const trafficSeries = computed(() => [
  { key: 'visitors', label: 'Unique visitors', values: trend.value?.days.map(d => d.visitors) ?? [] },
  { key: 'views', label: 'Page views', values: trend.value?.days.map(d => d.views) ?? [] }
])
const signupSeries = computed(() => [
  { key: 'signups', label: 'New accounts', values: trend.value?.days.map(d => d.signups) ?? [] }
])
// Paise from the API, rupees on the chart.
const raisedSeries = computed(() => [
  { key: 'raised', label: 'Raised', values: trend.value?.days.map(d => Math.round(d.raised / 100)) ?? [] }
])
const rangeLabel = computed(() => RANGES.find(r => r.days === range.value)?.label ?? '')

/** One picked day across every chart in the section: the crosshairs move together. */
const pickedDay = ref<number | null>(null)
watch(range, () => {
  pickedDay.value = null
})

/** The journey, compressed to five stops: the same story the home page walks. */
const JOURNEY = [
  { year: '2018', label: 'The train', note: 'Mahroni to Bangalore, no plan' },
  { year: '2019', label: 'Learning', note: 'Java, SQL and the written round' },
  { year: '2019', label: 'First job', note: 'The 34th walk-in, ₹13,000 a month' },
  { year: '2022', label: 'The switch', note: 'Negotiated like the guide says' },
  { year: 'Now', label: 'Europe', note: 'Salesforce engineer, writing this' }
] as const

const maxCountry = computed(() => Math.max(1, ...(details.value?.countries || []).map(c => c.visitors)))
const maxPage = computed(() => Math.max(1, ...(details.value?.topPages || []).map(p => p.views)))

// "Did you get a job?"
const job = reactive({ company: '', package: '' })
const jobState = ref<'idle' | 'saving' | 'done' | 'error'>('idle')
const jobMessage = ref('')

async function gotJob() {
  jobState.value = 'saving'
  try {
    const result = await $fetch<{ jobsGot: number, alreadyCounted: boolean }>('/api/jobs/got', {
      method: 'POST',
      body: { company: job.company || undefined, package: job.package || undefined }
    })
    if (summary.value) {
      summary.value.jobsGot = result.jobsGot
    }
    jobMessage.value = result.alreadyCounted
      ? 'You were already counted. I have updated the details.'
      : 'Counted. Congratulations, genuinely. Now tell the next person how in a story.'
    jobState.value = 'done'
  } catch (e) {
    jobMessage.value = apiError(e)
    jobState.value = 'error'
  }
}

usePageSeo({
  title: 'The numbers, in public',
  description: 'How many people read the Bangalore Job Seekers Guide, day by day, from where, what they read, how many got a job, and what it has raised.',
  headline: 'Stats'
})
</script>

<template>
  <div class="stats-page">
    <!-- Head ------------------------------------------------------------------- -->
    <header class="band guides">
      <div class="frame swiss-grid">
        <div class="col-span-full lg:col-span-9">
          <p class="label">
            <span class="mark" />
            Open stats
          </p>
          <h1 class="display mt-4">
            The numbers, in public
          </h1>
          <p class="lede mt-5">
            Everything this site counts, shown to everybody. No Google Analytics
            and no tracking scripts: my own server counts page views with a
            random id per browser, and nothing about who you are.
          </p>
        </div>
      </div>
    </header>

    <!-- The site sponsor, as the leaderboard strip ------------------------------- -->
    <div class="band guides stats-sponsor">
      <div class="frame">
        <SponsorSlot
          name="brand"
          format="leaderboard"
        />
      </div>
    </div>

    <!-- The journey, in one strip -------------------------------------------------- -->
    <section
      class="band guides"
      aria-label="The journey behind these numbers"
    >
      <div class="frame">
        <ol class="strip">
          <li
            v-for="(stop, i) in JOURNEY"
            :key="stop.label"
            class="strip__stop"
            :data-now="i === JOURNEY.length - 1 ? '' : undefined"
          >
            <span class="strip__year num">{{ stop.year }}</span>
            <span class="strip__label">{{ stop.label }}</span>
            <span class="strip__note">{{ stop.note }}</span>
          </li>
        </ol>
      </div>
    </section>

    <!-- Headline numbers -------------------------------------------------------- -->
    <section
      class="band guides"
      aria-label="Headline numbers"
    >
      <dl class="frame swiss-grid gap-y-8">
        <div
          v-for="t in numbers"
          :key="t.label"
          class="stat col-span-2 lg:col-span-3"
        >
          <dt class="label">
            {{ t.label }}
            <span
              v-if="t.live"
              class="mark"
              data-live
            />
          </dt>
          <dd>
            <USkeleton
              v-if="loading"
              class="mt-3 h-10 w-24"
            />
            <span
              v-else
              class="stat__value num"
            >{{ t.value }}</span>
            <span class="stat__note">{{ t.note }}</span>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Readers per day --------------------------------------------------------- -->
    <section
      class="band guides"
      aria-labelledby="trend-title"
    >
      <div class="frame">
        <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p class="label">
              Traffic
            </p>
            <h2
              id="trend-title"
              class="headline mt-2"
            >
              Readers per day
            </h2>
          </div>
          <div
            class="ranges"
            role="group"
            aria-label="Range"
          >
            <button
              v-for="r in RANGES"
              :key="r.days"
              type="button"
              class="ranges__btn num"
              :aria-pressed="range === r.days"
              @click="range = r.days"
            >
              {{ r.label }}
            </button>
          </div>
        </div>

        <div class="swiss-grid gap-y-12">
          <div class="col-span-full lg:col-span-8">
            <USkeleton
              v-if="!trend && (trendStatus === 'pending' || trendStatus === 'idle')"
              class="h-80 w-full"
            />
            <StatsChart
              v-else-if="trend?.days.length"
              v-model:active="pickedDay"
              :days="days"
              :series="trafficSeries"
              :caption="`Unique visitors and page views per day, last ${rangeLabel}`"
              :height="300"
              :class="{ 'opacity-50': trendStatus === 'pending' }"
            />
            <p
              v-else
              class="text-sm text-muted"
            >
              Nothing counted yet.
            </p>
          </div>

          <div class="col-span-full lg:col-span-4">
            <p class="label">
              New accounts
            </p>
            <p class="stat__value num mt-2">
              {{ trend ? formatCount(trend.totals.signups) : '–' }}
            </p>
            <p class="stat__note mb-5">
              Signed up in the last {{ rangeLabel }}
            </p>
            <StatsChart
              v-if="trend?.days.length"
              v-model:active="pickedDay"
              :days="days"
              :series="signupSeries"
              :caption="`New accounts per day, last ${rangeLabel}`"
              :height="160"
              class="chart--small"
              :class="{ 'opacity-50': trendStatus === 'pending' }"
            />
          </div>

          <div class="col-span-full lg:col-span-8">
            <p class="label">
              Earnings
            </p>
            <h3 class="headline mt-2">
              Raised per day
            </h3>
            <p class="mt-2 mb-5 text-sm text-muted">
              Gifts, tips and sponsor bids that actually cleared, by the day
              the checkout was opened. {{ trend ? formatPaise(trend.totals.raised) : '–' }}
              in the last {{ rangeLabel }}.
            </p>
            <StatsChart
              v-if="trend?.days.length"
              v-model:active="pickedDay"
              :days="days"
              :series="raisedSeries"
              format="inr"
              :caption="`Money raised per day in rupees, last ${rangeLabel}`"
              :height="220"
              :class="{ 'opacity-50': trendStatus === 'pending' }"
            />
          </div>
        </div>
        <p class="mt-6 text-xs text-muted">
          Days are counted in India time. A visitor is one browser on one day;
          the same person on a phone and a laptop counts twice. Admin and account
          pages are left out.
        </p>
      </div>
    </section>

    <!-- Top pages and countries ------------------------------------------------- -->
    <section
      class="band guides"
      aria-label="What people read and where they are"
    >
      <div class="frame swiss-grid gap-y-12">
        <div class="col-span-full lg:col-span-6">
          <h2 class="label mb-4">
            Most read, last 30 days
          </h2>
          <USkeleton
            v-if="detailsStatus === 'pending' || detailsStatus === 'idle'"
            class="h-64 w-full"
          />
          <ol
            v-else-if="details?.topPages.length"
            class="row-list"
          >
            <li
              v-for="(p, i) in details.topPages"
              :key="p.path"
              class="bar-row"
            >
              <span class="bar-row__n num">{{ String(i + 1).padStart(2, '0') }}</span>
              <NuxtLink
                :to="p.path"
                class="bar-row__name hover:text-primary"
              >{{ p.path }}</NuxtLink>
              <span class="bar-row__value num">{{ formatCount(p.views) }}</span>
              <span
                class="bar-row__bar"
                :style="{ width: `${Math.max(2, (p.views / maxPage) * 100)}%` }"
              />
            </li>
          </ol>
          <p
            v-else
            class="text-sm text-muted"
          >
            Nothing counted yet.
          </p>
        </div>

        <div class="col-span-full lg:col-span-6">
          <h2 class="label mb-4">
            Where readers are
          </h2>
          <USkeleton
            v-if="detailsStatus === 'pending' || detailsStatus === 'idle'"
            class="h-64 w-full"
          />
          <ol
            v-else-if="details?.countries.length"
            class="row-list countries"
          >
            <li
              v-for="c in details.countries"
              :key="c.country"
              class="bar-row"
            >
              <span
                class="bar-row__n"
                aria-hidden="true"
              >{{ countryFlag(c.country) }}</span>
              <span class="bar-row__name">{{ countryName(c.country) }}</span>
              <span class="bar-row__value num">{{ formatCount(c.visitors) }}</span>
              <span
                class="bar-row__bar"
                :style="{ width: `${Math.max(2, (c.visitors / maxCountry) * 100)}%` }"
              />
            </li>
          </ol>
          <p
            v-else
            class="text-sm text-muted"
          >
            Nothing counted yet.
          </p>
        </div>
      </div>
    </section>

    <!-- Become a sponsor -------------------------------------------------------- -->
    <section
      class="band guides cta"
      aria-labelledby="cta-title"
    >
      <div class="frame swiss-grid gap-y-8">
        <div class="col-span-full lg:col-span-8">
          <p class="label">
            <span class="mark" />
            Sponsor
          </p>
          <h2
            id="cta-title"
            class="display mt-4"
          >
            Become a sponsor
          </h2>
          <p class="lede mt-5">
            Every reader counted above is somebody looking for their first IT
            job. Design your card, put your company or your name in front of
            them, and keep the spot until somebody outbids you.
          </p>
        </div>
        <div class="col-span-full lg:col-span-4 flex flex-col justify-end gap-3">
          <UButton
            to="/sponsor"
            size="xl"
            icon="i-lucide-megaphone"
            class="justify-center"
          >
            Become a sponsor
          </UButton>
          <NuxtLink
            to="/sponsor#support"
            class="arrow-link"
          >
            Or give any amount
            <UIcon name="i-lucide-arrow-right" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Did you get a job? ------------------------------------------------------ -->
    <section
      class="band guides"
      aria-labelledby="job-title"
    >
      <div class="frame swiss-grid gap-y-6">
        <div class="col-span-full lg:col-span-5">
          <h2
            id="job-title"
            class="headline"
          >
            Did you get a job?
          </h2>
          <p class="mt-3 text-sm text-muted">
            Press the button and the counter above goes up by one. Company and
            package are optional and are never shown next to anything about you.
          </p>
        </div>
        <div class="col-span-full lg:col-span-6 lg:col-start-7">
          <form
            class="flex flex-wrap items-end gap-3"
            @submit.prevent="gotJob"
          >
            <UInput
              v-model="job.company"
              placeholder="Company (optional)"
              maxlength="80"
            />
            <UInput
              v-model="job.package"
              placeholder="Package (optional)"
              maxlength="40"
            />
            <UButton
              type="submit"
              color="neutral"
              icon="i-lucide-party-popper"
              :loading="jobState === 'saving'"
              :disabled="jobState === 'done'"
            >
              I got a job
            </UButton>
          </form>
          <p
            v-if="jobMessage"
            class="mt-3 text-sm"
            :class="jobState === 'error' ? 'text-error' : 'text-success'"
            role="status"
          >
            {{ jobMessage }}
            <NuxtLink
              v-if="jobState === 'done'"
              to="/stories/new"
              class="text-primary font-medium"
            >Share your story</NuxtLink>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* The sponsor's strip sits in a thin band of its own, not a full one. */
.stats-sponsor {
  padding-block: 2rem;
}

.stat {
  padding-top: 0.75rem;
  border-top: 2px solid var(--rule-strong);
}

.stat__value {
  display: block;
  margin-top: 0.5rem;
  font-size: clamp(1.75rem, 1.2rem + 1.6vw, 2.75rem);
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--ui-text-highlighted);
}

.stat__note {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
}

.ranges {
  display: inline-flex;
  border: 1px solid var(--ui-text-highlighted);
}

.ranges__btn {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  background: transparent;
  cursor: pointer;
}

.ranges__btn + .ranges__btn {
  border-left: 1px solid var(--ui-text-highlighted);
}

.ranges__btn[aria-pressed='true'] {
  color: var(--ui-bg);
  background: var(--ui-text-highlighted);
}

/* A row of a ranked list: number, name, value, and a hairline bar under it
   showing the share of the largest. */
.bar-row {
  position: relative;
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.625rem 0 0.75rem;
  font-size: 0.9375rem;
}

.bar-row__n {
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
}

.bar-row__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ui-text-highlighted);
}

.bar-row__value {
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.bar-row__bar {
  position: absolute;
  left: 2.75rem;
  bottom: -1px;
  height: 2px;
  max-width: calc(100% - 2.75rem);
  background: var(--ui-text-highlighted);
}

.bar-row:first-child .bar-row__bar {
  background: var(--ui-primary);
}

.countries {
  max-height: 32rem;
  overflow: auto;
}

.cta {
  border-top: 2px solid var(--rule-strong);
}

/* The journey strip: five stops on one rule, reading left to right. */
.strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--gutter, 1.5rem);
}

.strip__stop {
  position: relative;
  display: grid;
  gap: 0.25rem;
  padding-top: 0.875rem;
  border-top: 2px solid var(--rule-strong);
}

.strip__stop::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 0;
  width: 8px;
  height: 8px;
  background: var(--ui-text-highlighted);
}

.strip__stop[data-now]::before {
  background: var(--ui-primary);
}

.strip__year {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ui-text-dimmed);
}

.strip__stop[data-now] .strip__year {
  color: var(--ui-primary);
}

.strip__label {
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
}

.strip__note {
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
}
</style>
