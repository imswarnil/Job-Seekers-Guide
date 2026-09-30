<script setup lang="ts">
/** Content: what people wrote and who joined, over time. Sample content is not counted here. */
definePageMeta({ middleware: 'admin' })

const range = useAdminRange('30d')
const { data, error } = useAdminAnalytics(range)
const loading = computed(() => !data.value && !error.value)
const cur = computed(() => data.value?.totals.current)
const prev = computed(() => data.value?.totals.previous)

const tiles = [
  { key: 'signups' as const, label: 'New sign-ups', icon: 'i-lucide-user-plus' },
  { key: 'stories' as const, label: 'Stories', icon: 'i-lucide-footprints' },
  { key: 'guestbook' as const, label: 'Guestbook entries', icon: 'i-lucide-book-open-text' },
  { key: 'comments' as const, label: 'Comments', icon: 'i-lucide-message-square' }
]

const moderation = [
  { to: '/admin/stories', label: 'Stories', icon: 'i-lucide-footprints', text: 'Hide, feature or delete' },
  { to: '/admin/comments', label: 'Comments', icon: 'i-lucide-message-square', text: 'Read and delete' },
  { to: '/admin/guestbook', label: 'Guestbook', icon: 'i-lucide-book-open-text', text: 'Read and delete' },
  { to: '/admin/users', label: 'Users', icon: 'i-lucide-users', text: 'Everyone who has written' }
]

useSeoMeta({ title: 'Content · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Content"
    :description="`Sign-ups, stories, guestbook entries and comments for the ${RANGE_WORDS[range]}. Sample content is left out of these numbers.`"
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
        v-for="t in tiles"
        :key="t.key"
        :label="t.label"
        :icon="t.icon"
        :value="formatCount(cur?.[t.key])"
        :current="cur?.[t.key]"
        :previous="prev?.[t.key]"
        :loading="loading"
      />
    </div>

    <div class="mt-4 grid gap-4 xl:grid-cols-2">
      <AdminPanel
        title="Things written"
        :description="data ? `Per ${data.unit}` : undefined"
        :loading="loading"
      >
        <AdminTrendChart
          v-if="data"
          :points="data.series"
          :series="[{ key: 'comments', label: 'Comments' }, { key: 'stories', label: 'Stories' }, { key: 'guestbook', label: 'Guestbook' }]"
          :unit="data.unit"
          :label="`Stories, guestbook entries and comments per ${data.unit}, ${RANGE_WORDS[range]}`"
        />
      </AdminPanel>
      <AdminPanel
        title="New sign-ups"
        :description="data ? (data.signupsSource === 'neon_auth' ? `Accounts created in Neon Auth, per ${data.unit}` : `First write per person (Neon Auth's table was not readable), per ${data.unit}`) : undefined"
        :loading="loading"
      >
        <AdminTrendChart
          v-if="data"
          :points="data.series"
          :series="[{ key: 'signups', label: 'Sign-ups' }]"
          :unit="data.unit"
          :label="`New sign-ups per ${data.unit}, ${RANGE_WORDS[range]}`"
        />
      </AdminPanel>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-3">
      <AdminPanel
        title="Moderate"
        class="lg:col-span-2"
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <NuxtLink
            v-for="m in moderation"
            :key="m.to"
            :to="m.to"
            class="card-hover flex items-center gap-3 border border-default p-3"
          >
            <UIcon
              :name="m.icon"
              class="size-5 text-primary"
            />
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-highlighted">{{ m.label }}</span>
              <span class="block text-xs text-muted">{{ m.text }}</span>
            </span>
            <UIcon
              name="i-lucide-arrow-right"
              class="ml-auto size-4 text-dimmed"
            />
          </NuxtLink>
        </div>
        <p class="mt-3 text-xs text-muted">
          Finer edits (a story's title, a guestbook message, a comment's text) are in
          <NuxtLink
            to="/admin/tables?t=stories"
            class="text-primary"
          >Tables</NuxtLink>, and every change is recorded in
          <NuxtLink
            to="/admin/audit"
            class="text-primary"
          >Audit</NuxtLink>.
        </p>
      </AdminPanel>
      <AdminSamplePanel />
    </div>
  </AdminShell>
</template>
