<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

interface AdminEntry {
  id: number
  name: string
  message: string
  gif: string | null
  learned: string | null
  hidden: boolean
  createdAt: string
  email: string | null
  sample?: boolean
}

const { data, status, error, refresh } = useFetch<{ items: AdminEntry[] }>('/api/admin/guestbook', { server: false, lazy: true })
const busy = ref<number | null>(null)

async function remove(entry: AdminEntry) {
  if (!window.confirm(`Delete ${entry.name}'s entry?`)) {
    return
  }
  busy.value = entry.id
  try {
    await $fetch(`/api/admin/guestbook/${entry.id}`, { method: 'DELETE' })
    await refresh()
  } finally {
    busy.value = null
  }
}

useSeoMeta({ title: 'Guestbook · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Guestbook"
    description="Every entry. Entries go live when they are posted."
  >
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="apiError(error)"
    />
    <USkeleton
      v-else-if="status === 'pending' && !data"
      class="h-64 w-full"
    />
    <p
      v-else-if="!data?.items.length"
      class="text-muted"
    >
      Nobody has signed it yet.
    </p>
    <ul
      v-else
      class="divide-y divide-default border border-default rounded-lg"
    >
      <li
        v-for="g in data.items"
        :key="g.id"
        class="p-4 flex gap-4"
      >
        <div class="min-w-0 flex-1">
          <p class="text-xs text-muted">
            <UBadge
              v-if="g.sample"
              color="warning"
              variant="subtle"
              size="sm"
              class="mr-1"
            >
              Sample
            </UBadge>
            {{ g.name }} ({{ g.email || 'no email' }}) · {{ formatAgo(g.createdAt) }}
          </p>
          <p class="mt-1 text-sm whitespace-pre-line">
            {{ g.message }}
          </p>
          <p
            v-if="g.learned"
            class="mt-1 text-sm text-muted whitespace-pre-line"
          >
            Learned: {{ g.learned }}
          </p>
          <img
            v-if="g.gif"
            :src="g.gif"
            alt=""
            class="mt-2 max-h-24 rounded"
            referrerpolicy="no-referrer"
          >
        </div>
        <UButton
          size="sm"
          color="error"
          variant="ghost"
          icon="i-lucide-trash-2"
          :loading="busy === g.id"
          aria-label="Delete entry"
          @click="remove(g)"
        />
      </li>
    </ul>
  </AdminShell>
</template>
