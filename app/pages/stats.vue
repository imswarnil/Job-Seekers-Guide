<script setup lang="ts">
/**
 * The public numbers, all of them. Counted on this site's own server, with no
 * third-party analytics: a random cookie id per browser, the page, the
 * referring site and the country. That is the whole list.
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
  perDay: { day: string, views: number }[]
}

const { data: summary, status } = useFetch<Summary>('/api/stats/summary', { server: false, lazy: true })
const { data: details } = useFetch<Details>('/api/stats/details', { server: false, lazy: true })

const tiles = computed(() => {
  const s = summary.value
  return [
    { label: 'Visitors', value: s ? formatCount(s.visitors) : '–', icon: 'i-lucide-users' },
    { label: 'Pages read', value: s ? formatCount(s.pageViews) : '–', icon: 'i-lucide-book-open' },
    { label: 'Reading right now', value: s ? formatCount(s.liveNow) : '–', icon: 'i-lucide-radio', live: true },
    { label: 'Countries', value: s ? formatCount(s.countries) : '–', icon: 'i-lucide-globe' },
    { label: 'Got a job', value: s ? formatCount(s.jobsGot) : '–', icon: 'i-lucide-briefcase' },
    { label: 'Stories shared', value: s ? formatCount(s.stories) : '–', icon: 'i-lucide-footprints' },
    { label: 'Raised', value: s ? formatPaise(s.raised) : '–', icon: 'i-lucide-heart-handshake' },
    { label: 'Sponsors', value: s ? formatCount(s.sponsors) : '–', icon: 'i-lucide-megaphone' }
  ]
})

const maxCountry = computed(() => Math.max(1, ...(details.value?.countries || []).map(c => c.visitors)))

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
  description: 'How many people read the Bangalore Job Seekers Guide, from where, what they read, how many got a job, and what it has raised.',
  headline: 'Stats'
})
</script>

<template>
  <CommunityPage
    width="wide"
    kicker="Open stats"
    icon="i-lucide-chart-column"
    title="The numbers, in public"
    description="Everything this site counts, shown to everybody. No Google Analytics and no tracking scripts: my own server counts page views with a random id per browser, and nothing about who you are."
  >
    <div class="tiles">
      <div
        v-for="t in tiles"
        :key="t.label"
        class="tile"
      >
        <div class="flex items-center gap-2 text-sm text-muted">
          <UIcon
            :name="t.icon"
            class="size-4"
          />
          {{ t.label }}
          <span
            v-if="t.live && summary?.liveNow"
            class="live-dot"
          />
        </div>
        <USkeleton
          v-if="status === 'pending' || status === 'idle'"
          class="mt-2 h-8 w-24"
        />
        <p
          v-else
          class="tile__value"
        >
          {{ t.value }}
        </p>
      </div>
    </div>

    <section class="cta">
      <div>
        <p class="cta__title">
          Become a sponsor of this project
        </p>
        <p class="cta__text">
          Every reader above is somebody looking for their first IT job. Put your
          company or your name in front of them, and keep the spot until somebody
          outbids you.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          to="/sponsor"
          size="xl"
          icon="i-lucide-megaphone"
        >
          Become a sponsor
        </UButton>
        <UButton
          to="/support"
          size="xl"
          color="neutral"
          variant="outline"
          icon="i-lucide-heart"
        >
          Or give any amount
        </UButton>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-2 mt-10">
      <UCard>
        <ViewsChart
          v-if="details?.perDay.length"
          :points="details.perDay"
          label="Pages read per day, last 30 days"
        />
        <USkeleton
          v-else
          class="h-44 w-full"
        />
      </UCard>

      <UCard>
        <p class="text-sm text-muted mb-3">
          Most read, last 30 days
        </p>
        <ol
          v-if="details?.topPages.length"
          class="space-y-2 text-sm"
        >
          <li
            v-for="p in details.topPages"
            :key="p.path"
            class="flex items-center gap-3"
          >
            <NuxtLink
              :to="p.path"
              class="min-w-0 flex-1 truncate text-default hover:text-primary"
            >{{ p.path }}</NuxtLink>
            <span class="tabular-nums text-muted">{{ formatCount(p.views) }}</span>
          </li>
        </ol>
        <p
          v-else
          class="text-sm text-muted"
        >
          Nothing counted yet.
        </p>
      </UCard>
    </div>

    <UCard class="mt-6">
      <p class="text-sm text-muted mb-3">
        Where readers are
      </p>
      <ul
        v-if="details?.countries.length"
        class="countries"
      >
        <li
          v-for="c in details.countries"
          :key="c.country"
        >
          <span class="w-6 text-center">{{ countryFlag(c.country) }}</span>
          <span class="min-w-0 flex-1 truncate">{{ countryName(c.country) }}</span>
          <span
            class="bar"
            :style="{ width: `${Math.max(4, (c.visitors / maxCountry) * 100)}%` }"
          />
          <span class="tabular-nums text-muted w-12 text-right">{{ formatCount(c.visitors) }}</span>
        </li>
      </ul>
      <p
        v-else
        class="text-sm text-muted"
      >
        Nothing counted yet.
      </p>
    </UCard>

    <UCard class="mt-6">
      <p class="font-semibold text-highlighted">
        Did you get a job?
      </p>
      <p class="mt-1 text-sm text-muted">
        Press the button and the counter above goes up by one. Company and
        package are optional and are never shown next to anything about you.
      </p>
      <form
        class="mt-4 flex flex-wrap items-end gap-3"
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
      >
        {{ jobMessage }}
        <NuxtLink
          v-if="jobState === 'done'"
          to="/stories/new"
          class="text-primary font-medium"
        >Share your story</NuxtLink>
      </p>
    </UCard>
  </CommunityPage>
</template>

<style scoped>
.tiles {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr));
}

.tile {
  padding: 1rem 1.125rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-lg, 0.75rem);
}

.tile__value {
  margin-top: 0.375rem;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
  font-variant-numeric: tabular-nums;
}

.live-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--ui-success);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--ui-success) 25%, transparent);
}

.cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  margin-top: 2rem;
  padding: 1.5rem 1.75rem;
  border-radius: var(--radius-xl, 1rem);
  background: color-mix(in oklab, var(--ui-primary) 9%, var(--ui-bg));
  border: 1px solid color-mix(in oklab, var(--ui-primary) 35%, transparent);
}

.cta__title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--ui-text-highlighted);
}

.cta__text {
  margin-top: 0.25rem;
  max-width: 36rem;
  color: var(--ui-text-muted);
}

.countries {
  display: grid;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.countries li {
  display: grid;
  grid-template-columns: 1.5rem minmax(6rem, 12rem) 1fr 3rem;
  align-items: center;
  gap: 0.75rem;
}

.countries .bar {
  height: 0.5rem;
  border-radius: 999px;
  background: color-mix(in oklab, var(--ui-primary) 55%, transparent);
}
</style>
