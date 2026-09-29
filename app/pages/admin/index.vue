<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

interface Analytics {
  days: number
  totals: { visitors: number, pageViews: number, liveNow: number, sessionsInRange: number, viewsInRange: number }
  perDay: { day: string, views: number, sessions: number }[]
  topPages: { path: string, views: number }[]
  countries: { country: string, sessions: number }[]
  referrers: { host: string, views: number }[]
  live: { path: string | null, country: string | null, lastSeen: string }[]
}

const days = ref(30)
const { data, status, error, refresh } = useFetch<Analytics>('/api/admin/analytics', {
  query: { days },
  server: false,
  lazy: true
})

// The live panel refreshes itself every 30 seconds while the page is open.
const timer = ref<ReturnType<typeof setInterval>>()
onMounted(() => {
  timer.value = setInterval(() => refresh(), 30_000)
})
onBeforeUnmount(() => clearInterval(timer.value))

const tiles = computed(() => data.value
  ? [
      { label: 'Live now', value: data.value.totals.liveNow },
      { label: `Sessions, ${days.value} days`, value: data.value.totals.sessionsInRange },
      { label: `Views, ${days.value} days`, value: data.value.totals.viewsInRange },
      { label: 'Visitors, all time', value: data.value.totals.visitors },
      { label: 'Views, all time', value: data.value.totals.pageViews }
    ]
  : [])

const ranges = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '1 year', value: 365 }
]

useSeoMeta({ title: 'Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Dashboard"
    description="First-party analytics. Live means seen in the last five minutes."
  >
    <template #actions>
      <USelect
        v-model="days"
        :items="ranges"
        class="w-32"
      />
    </template>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="apiError(error)"
      class="mb-6"
    />

    <div
      v-if="status === 'pending' && !data"
      class="grid gap-4 sm:grid-cols-3 lg:grid-cols-5"
    >
      <USkeleton
        v-for="n in 5"
        :key="n"
        class="h-20"
      />
    </div>

    <template v-if="data">
      <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <UCard
          v-for="t in tiles"
          :key="t.label"
        >
          <p class="text-xs text-muted">
            {{ t.label }}
          </p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-highlighted">
            {{ formatCount(t.value) }}
          </p>
        </UCard>
      </div>

      <UCard class="mt-6">
        <ViewsChart
          :points="data.perDay"
          :label="`Page views per day, last ${days} days`"
        />
      </UCard>

      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <UCard>
          <p class="text-sm font-medium text-highlighted mb-3">
            Top pages
          </p>
          <ol class="space-y-1.5 text-sm">
            <li
              v-for="p in data.topPages"
              :key="p.path"
              class="flex gap-3"
            >
              <NuxtLink
                :to="p.path"
                class="min-w-0 flex-1 truncate hover:text-primary"
              >{{ p.path }}</NuxtLink>
              <span class="tabular-nums text-muted">{{ formatCount(p.views) }}</span>
            </li>
            <li
              v-if="!data.topPages.length"
              class="text-muted"
            >
              Nothing yet.
            </li>
          </ol>
        </UCard>

        <UCard>
          <p class="text-sm font-medium text-highlighted mb-3">
            Countries
          </p>
          <ol class="space-y-1.5 text-sm">
            <li
              v-for="c in data.countries"
              :key="c.country"
              class="flex gap-3"
            >
              <span>{{ countryFlag(c.country) }}</span>
              <span class="min-w-0 flex-1 truncate">{{ countryName(c.country) }}</span>
              <span class="tabular-nums text-muted">{{ formatCount(c.sessions) }}</span>
            </li>
            <li
              v-if="!data.countries.length"
              class="text-muted"
            >
              Nothing yet.
            </li>
          </ol>
        </UCard>

        <UCard>
          <p class="text-sm font-medium text-highlighted mb-3">
            Referrers
          </p>
          <ol class="space-y-1.5 text-sm">
            <li
              v-for="r in data.referrers"
              :key="r.host"
              class="flex gap-3"
            >
              <span class="min-w-0 flex-1 truncate">{{ r.host }}</span>
              <span class="tabular-nums text-muted">{{ formatCount(r.views) }}</span>
            </li>
            <li
              v-if="!data.referrers.length"
              class="text-muted"
            >
              No outside referrers yet.
            </li>
          </ol>
        </UCard>
      </div>

      <UCard class="mt-6">
        <p class="text-sm font-medium text-highlighted mb-3">
          Reading right now
        </p>
        <ul class="space-y-1.5 text-sm">
          <li
            v-for="(l, i) in data.live"
            :key="i"
            class="flex gap-3"
          >
            <span>{{ countryFlag(l.country) }}</span>
            <span class="min-w-0 flex-1 truncate">{{ l.path || '(unknown)' }}</span>
            <span class="text-muted">{{ formatAgo(l.lastSeen) }}</span>
          </li>
          <li
            v-if="!data.live.length"
            class="text-muted"
          >
            Nobody in the last five minutes.
          </li>
        </ul>
      </UCard>
    </template>
  </AdminShell>
</template>
