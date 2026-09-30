<script setup lang="ts">
/** Traffic: views and visitors over time, and where they come from. */
definePageMeta({ middleware: 'admin' })

const range = useAdminRange('30d')
const { data, error } = useAdminAnalytics(range)
const loading = computed(() => !data.value && !error.value)

const cur = computed(() => data.value?.totals.current)
const prev = computed(() => data.value?.totals.previous)
const perVisitor = (t?: AdminTotals) => (t?.visitors ? t.views / t.visitors : 0)
const one = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 })

const DEVICE_LABELS: Record<string, string> = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop', unknown: 'Not recorded' }

useSeoMeta({ title: 'Traffic · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Traffic"
    :description="`Page views and unique visitors for the ${RANGE_WORDS[range]}. A visitor is one browser (a random first-party cookie).`"
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

    <div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <AdminStat
        label="Unique visitors"
        icon="i-lucide-users"
        :value="formatCount(cur?.visitors)"
        :current="cur?.visitors"
        :previous="prev?.visitors"
        :loading="loading"
      />
      <AdminStat
        label="Page views"
        icon="i-lucide-eye"
        :value="formatCount(cur?.views)"
        :current="cur?.views"
        :previous="prev?.views"
        :loading="loading"
      />
      <AdminStat
        label="Views per visitor"
        icon="i-lucide-layers"
        :value="one.format(perVisitor(cur))"
        :current="perVisitor(cur)"
        :previous="perVisitor(prev)"
        :loading="loading"
      />
      <AdminStat
        label="Countries"
        icon="i-lucide-globe"
        :value="formatCount(data?.countries.filter(c => c.country !== '??').length)"
        :loading="loading"
      />
    </div>

    <AdminPanel
      title="Views and visitors"
      :description="data ? `Per ${data.unit}, ${data.tz} time. Hover for exact numbers.` : undefined"
      :loading="loading"
      class="mt-4"
    >
      <AdminTrendChart
        v-if="data"
        :points="data.series"
        :series="[{ key: 'views', label: 'Page views' }, { key: 'visitors', label: 'Unique visitors' }]"
        :unit="data.unit"
        :height="260"
        :label="`Page views and unique visitors per ${data.unit}, ${RANGE_WORDS[range]}`"
      />
    </AdminPanel>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <AdminPanel
        title="Top pages"
        :loading="loading"
        :empty="data && !data.topPages.length"
      >
        <AdminBarList
          v-if="data"
          :items="data.topPages.map(p => ({ key: p.path, label: p.path, value: p.views, to: p.path, hint: `${formatCount(p.visitors)} visitors` }))"
          :limit="12"
        />
      </AdminPanel>
      <AdminPanel
        title="Referrers"
        description="The outside site a visit came from; direct visits and this site are not listed."
        :loading="loading"
        :empty="data && !data.referrers.length"
        empty-text="No outside referrers in this range."
      >
        <AdminBarList
          v-if="data"
          :items="data.referrers.map(r => ({ key: r.host, label: r.host, value: r.views, hint: `${formatCount(r.visitors)} visitors` }))"
          :limit="12"
        />
      </AdminPanel>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-3">
      <AdminPanel
        title="Countries and regions"
        description="From Cloudflare's country header. Share is of visitors in this range."
        :loading="loading"
        :empty="data && !data.countries.length"
        flush
        class="lg:col-span-2"
      >
        <div
          v-if="data"
          class="overflow-x-auto max-h-[28rem] overflow-y-auto"
        >
          <table class="w-full text-sm">
            <thead class="sticky top-0 text-xs text-muted border-y border-default bg-elevated">
              <tr>
                <th class="text-left font-medium px-4 py-2">
                  Country or region
                </th>
                <th class="text-right font-medium px-2 py-2">
                  Visitors
                </th>
                <th class="text-right font-medium px-2 py-2">
                  Views
                </th>
                <th class="text-left font-medium px-4 py-2 w-1/3">
                  Share
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="c in data.countries"
                :key="c.country"
              >
                <td class="px-4 py-2">
                  <span class="mr-2">{{ countryFlag(c.country) }}</span>{{ countryName(c.country) }}
                  <span class="ml-1 text-xs text-dimmed">{{ c.country === '??' ? '' : c.country }}</span>
                </td>
                <td class="px-2 py-2 text-right tabular-nums">
                  {{ formatCount(c.visitors) }}
                </td>
                <td class="px-2 py-2 text-right tabular-nums text-muted">
                  {{ formatCount(c.views) }}
                </td>
                <td class="px-4 py-2">
                  <div class="flex items-center gap-2">
                    <div class="h-1.5 flex-1 bg-elevated">
                      <div
                        class="h-full bg-primary"
                        :style="{ width: `${c.share * 100}%` }"
                      />
                    </div>
                    <span class="w-12 text-right text-xs tabular-nums text-muted">{{ formatShare(c.share) }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Devices"
        description="Mobile, tablet or desktop, worked out from the browser when the visit is recorded. Visits before this was added show as not recorded."
        :loading="loading"
        :empty="data && !data.devices.length"
      >
        <AdminBarList
          v-if="data"
          :items="data.devices.map(d => ({ key: d.device, label: DEVICE_LABELS[d.device] || d.device, value: d.visitors, share: d.share, icon: deviceIcon(d.device) }))"
          value-label="Visitors"
          share-label="Share"
        />
      </AdminPanel>
    </div>
  </AdminShell>
</template>
