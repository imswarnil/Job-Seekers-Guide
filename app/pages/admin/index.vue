<script setup lang="ts">
/** Overview: the numbers that matter for the chosen range, the trend, and who is here now. */
definePageMeta({ middleware: 'admin' })

const range = useAdminRange('7d')
const { data, error } = useAdminAnalytics(range)
const { data: live } = useAdminLive()

const loading = computed(() => !data.value && !error.value)
const cur = computed(() => data.value?.totals.current)
const prev = computed(() => data.value?.totals.previous)

const tiles = computed(() => [
  { label: 'Visitors', icon: 'i-lucide-users', key: 'visitors' as const },
  { label: 'Page views', icon: 'i-lucide-eye', key: 'views' as const },
  { label: 'Sign-ups', icon: 'i-lucide-user-plus', key: 'signups' as const },
  { label: 'Stories', icon: 'i-lucide-footprints', key: 'stories' as const },
  { label: 'Money in', icon: 'i-lucide-indian-rupee', key: 'money' as const }
].map(t => ({
  ...t,
  value: t.key === 'money' ? formatPaise(cur.value?.money) : formatCount(cur.value?.[t.key]),
  current: cur.value?.[t.key],
  previous: prev.value?.[t.key]
})))

useSeoMeta({ title: 'Overview · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Overview"
    :description="`First-party analytics for the ${RANGE_WORDS[range]}, compared with the ${RANGE_WORDS[range].replace('last', 'previous')}.`"
  >
    <template #actions>
      <AdminRangePicker v-model="range" />
    </template>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="apiError(error)"
      class="mb-6"
    />

    <div class="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      <NuxtLink
        to="/admin/live"
        class="card-hover block"
      >
        <AdminStat
          label="Online now"
          icon="i-lucide-radio"
          :value="live ? formatCount(live.online) : '–'"
          hint="seen in the last 5 minutes"
          :loading="!live"
        />
      </NuxtLink>
      <AdminStat
        v-for="t in tiles"
        :key="t.key"
        :label="t.label"
        :icon="t.icon"
        :value="t.value"
        :current="t.current"
        :previous="t.previous"
        :loading="loading"
      />
    </div>

    <div class="mt-4 grid gap-4 xl:grid-cols-3">
      <AdminPanel
        title="Views and visitors"
        :description="data ? `Per ${data.unit}, ${data.tz} time` : undefined"
        :loading="loading"
        class="xl:col-span-2"
      >
        <AdminTrendChart
          v-if="data"
          :points="data.series"
          :series="[{ key: 'views', label: 'Page views' }, { key: 'visitors', label: 'Unique visitors' }]"
          :unit="data.unit"
          :label="`Page views and unique visitors per ${data.unit}, ${RANGE_WORDS[range]}`"
        />
      </AdminPanel>

      <AdminPanel
        title="Reading right now"
        description="Refreshes every 10 seconds"
        :loading="!live"
        :empty="live && !live.pages.length"
        empty-text="Nobody in the last five minutes."
      >
        <template #actions>
          <UButton
            to="/admin/live"
            size="xs"
            color="neutral"
            variant="ghost"
            trailing-icon="i-lucide-arrow-right"
          >
            Live
          </UButton>
        </template>
        <AdminBarList
          v-if="live"
          :items="live.pages.map(p => ({ key: p.path, label: p.path, value: p.visitors, to: p.path.startsWith('/') ? p.path : undefined }))"
          value-label="Visitors"
          :limit="6"
        />
      </AdminPanel>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <AdminPanel
        title="Top pages"
        :loading="loading"
        :empty="data && !data.topPages.length"
      >
        <AdminBarList
          v-if="data"
          :items="data.topPages.map(p => ({ key: p.path, label: p.path, value: p.views, to: p.path }))"
          :limit="6"
        />
      </AdminPanel>
      <AdminPanel
        title="Countries"
        :loading="loading"
        :empty="data && !data.countries.length"
      >
        <AdminBarList
          v-if="data"
          :items="data.countries.map(c => ({ key: c.country, label: countryName(c.country), value: c.visitors, share: c.share, flag: countryFlag(c.country) }))"
          value-label="Visitors"
          share-label="Share"
          :limit="6"
        />
      </AdminPanel>
      <AdminSamplePanel />
    </div>
  </AdminShell>
</template>
