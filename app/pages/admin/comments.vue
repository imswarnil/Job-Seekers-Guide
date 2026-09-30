<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

interface AdminComment { id: number, path: string, body: string, createdAt: string, name: string | null, email: string | null, sample?: boolean }

const { data, status, error, refresh } = useFetch<{ items: AdminComment[] }>('/api/admin/comments', { server: false, lazy: true })
const busy = ref<number | null>(null)

async function remove(c: AdminComment) {
  if (!window.confirm('Delete this comment?')) {
    return
  }
  busy.value = c.id
  try {
    await $fetch(`/api/admin/comments/${c.id}`, { method: 'DELETE' })
    await refresh()
  } finally {
    busy.value = null
  }
}

useSeoMeta({ title: 'Comments · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Comments"
    description="The latest 500 comments across every lesson. Every delete is audited."
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
      No comments yet.
    </p>
    <ul
      v-else
      class="divide-y divide-default border border-default rounded-lg"
    >
      <li
        v-for="c in data.items"
        :key="c.id"
        class="p-4 flex gap-4"
      >
        <div class="min-w-0 flex-1">
          <p class="text-xs text-muted">
            <UBadge
              v-if="c.sample"
              color="warning"
              variant="subtle"
              size="sm"
              class="mr-1"
            >
              Sample
            </UBadge>
            <NuxtLink
              :to="c.path"
              class="text-primary"
            >{{ c.path }}</NuxtLink>
            · {{ c.name || 'A reader' }} ({{ c.email || 'no email' }}) · {{ formatAgo(c.createdAt) }}
          </p>
          <p class="mt-1 text-sm whitespace-pre-line">
            {{ c.body }}
          </p>
        </div>
        <UButton
          size="sm"
          color="error"
          variant="ghost"
          icon="i-lucide-trash-2"
          :loading="busy === c.id"
          aria-label="Delete comment"
          @click="remove(c)"
        />
      </li>
    </ul>
  </AdminShell>
</template>
