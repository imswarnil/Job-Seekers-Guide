<script setup lang="ts">
/**
 * Live: who is on the site now (a session seen in the last five minutes), which
 * page each is on, where they are, and every page view as it lands. Polls every
 * ten seconds while the tab is visible.
 */
definePageMeta({ middleware: 'admin' })

const { data, status, error, refresh } = useAdminLive(10_000)
const loading = computed(() => !data.value && !error.value)

// The ticker under the heading: seconds since the last snapshot.
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  clock = setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => clearInterval(clock))
const age = computed(() => (data.value ? Math.max(0, Math.round((now.value - new Date(data.value.at).getTime()) / 1000)) : null))

const viewsLast30 = computed(() => data.value?.perMinute.reduce((sum, p) => sum + p.views, 0) ?? 0)
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

useSeoMeta({ title: 'Live · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Live"
    description="A visitor is online when their browser has loaded a page in the last five minutes. No personal data: each is a random cookie, shown as a short label."
  >
    <template #actions>
      <span class="flex items-center gap-2 text-xs text-muted">
        <span class="relative flex size-2">
          <span class="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
          <span class="relative inline-flex size-2 rounded-full bg-success" />
        </span>
        <span v-if="age !== null">Updated {{ age }} s ago</span>
      </span>
      <UButton
        size="sm"
        color="neutral"
        variant="outline"
        icon="i-lucide-refresh-cw"
        :loading="status === 'pending'"
        @click="refresh()"
      >
        Refresh
      </UButton>
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
        label="Online now"
        icon="i-lucide-radio"
        :value="formatCount(data?.online)"
        :loading="loading"
      />
      <AdminStat
        label="Pages being read"
        icon="i-lucide-file-text"
        :value="formatCount(data?.pages.length)"
        :loading="loading"
      />
      <AdminStat
        label="Countries now"
        icon="i-lucide-globe"
        :value="formatCount(data?.countries.length)"
        :loading="loading"
      />
      <AdminStat
        label="Views, last 30 minutes"
        icon="i-lucide-eye"
        :value="formatCount(viewsLast30)"
        :loading="loading"
      />
    </div>

    <AdminPanel
      title="Page views per minute"
      description="The last 30 minutes"
      :loading="loading"
      class="mt-4"
    >
      <AdminTrendChart
        v-if="data"
        :points="data.perMinute"
        :series="[{ key: 'views', label: 'Page views' }]"
        unit="minute"
        :height="120"
        label="Page views per minute, last 30 minutes"
      />
    </AdminPanel>

    <div class="mt-4 grid gap-4 lg:grid-cols-3">
      <AdminPanel
        title="On the site now"
        :loading="loading"
        :empty="data && !data.visitors.length"
        empty-text="Nobody in the last five minutes."
        flush
        class="lg:col-span-2"
      >
        <div
          v-if="data"
          class="overflow-x-auto"
        >
          <table class="w-full text-sm">
            <thead class="text-xs text-muted border-y border-default bg-elevated/50">
              <tr>
                <th class="text-left font-medium px-4 py-2">
                  Visitor
                </th>
                <th class="text-left font-medium px-2 py-2">
                  Page
                </th>
                <th class="text-left font-medium px-2 py-2">
                  Where
                </th>
                <th class="text-right font-medium px-2 py-2">
                  Views
                </th>
                <th class="text-right font-medium px-4 py-2">
                  Last seen
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="v in data.visitors"
                :key="v.label"
              >
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="inline-flex items-center gap-2">
                    <UIcon
                      :name="deviceIcon(v.device)"
                      class="size-4 text-muted"
                      :aria-label="v.device || 'unknown device'"
                    />
                    <code class="text-xs">{{ v.label }}</code>
                  </span>
                </td>
                <td class="px-2 py-2 max-w-[20rem] truncate">
                  <NuxtLink
                    v-if="v.path"
                    :to="v.path"
                    class="hover:text-primary"
                  >{{ v.path }}</NuxtLink>
                  <span
                    v-else
                    class="text-muted"
                  >(unknown)</span>
                </td>
                <td class="px-2 py-2 whitespace-nowrap">
                  {{ countryFlag(v.country) }} {{ countryName(v.country) }}
                </td>
                <td class="px-2 py-2 text-right tabular-nums">
                  {{ v.views }}
                </td>
                <td class="px-4 py-2 text-right text-muted whitespace-nowrap">
                  {{ formatAgo(v.lastSeen) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <div class="grid gap-4 content-start">
        <AdminPanel
          title="Pages now"
          :loading="loading"
          :empty="data && !data.pages.length"
          empty-text="No pages open."
        >
          <AdminBarList
            v-if="data"
            :items="data.pages.map(p => ({ key: p.path, label: p.path, value: p.visitors, to: p.path.startsWith('/') ? p.path : undefined }))"
            value-label="Visitors"
          />
        </AdminPanel>
        <AdminPanel
          title="Countries now"
          :loading="loading"
          :empty="data && !data.countries.length"
          empty-text="Nobody right now."
        >
          <AdminBarList
            v-if="data"
            :items="data.countries.map(c => ({ key: c.country, label: countryName(c.country), value: c.visitors, share: data!.online ? c.visitors / data!.online : 0, flag: countryFlag(c.country) }))"
            value-label="Visitors"
            share-label="Share"
          />
        </AdminPanel>
      </div>
    </div>

    <AdminPanel
      title="Latest page views"
      description="The 40 most recent, newest first"
      :loading="loading"
      :empty="data && !data.feed.length"
      empty-text="No page views recorded yet."
      flush
      class="mt-4"
    >
      <ol
        v-if="data"
        class="divide-y divide-default border-t border-default text-sm"
        aria-live="polite"
      >
        <li
          v-for="f in data.feed"
          :key="f.id"
          class="flex items-center gap-3 px-4 py-2"
        >
          <time
            class="text-xs tabular-nums text-muted w-16 shrink-0"
            :datetime="f.ts"
          >{{ time.format(new Date(f.ts)) }}</time>
          <span
            class="shrink-0"
            :title="countryName(f.country)"
          >{{ countryFlag(f.country) }}</span>
          <UIcon
            :name="deviceIcon(f.device)"
            class="size-4 text-muted shrink-0"
            :aria-label="f.device || 'unknown device'"
          />
          <NuxtLink
            :to="f.path"
            class="min-w-0 flex-1 truncate hover:text-primary"
          >
            {{ f.path }}
          </NuxtLink>
          <span
            v-if="f.referrer"
            class="hidden sm:inline text-xs text-muted truncate max-w-[12rem]"
          >from {{ f.referrer }}</span>
          <code
            v-if="f.label"
            class="text-xs text-dimmed"
          >{{ f.label }}</code>
        </li>
      </ol>
    </AdminPanel>
  </AdminShell>
</template>
