<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

interface AdminStory {
  id: number
  title: string
  from: string
  to: string
  snippet?: string
  votes: number
  status: 'visible' | 'hidden' | 'featured'
  email: string | null
  author: { name: string }
  createdAt: string
  sample?: boolean
}

const { data, status, error, refresh } = useFetch<{ items: AdminStory[] }>('/api/admin/stories', { server: false, lazy: true })
const busy = ref<number | null>(null)
const actionError = ref('')

async function setStatus(story: AdminStory, next: AdminStory['status']) {
  busy.value = story.id
  actionError.value = ''
  try {
    await $fetch(`/api/admin/stories/${story.id}`, { method: 'PATCH', body: { status: next } })
    story.status = next
  } catch (e) {
    actionError.value = apiError(e)
  } finally {
    busy.value = null
  }
}

async function remove(story: AdminStory) {
  if (!window.confirm(`Delete "${story.title}" and its media for good?`)) {
    return
  }
  busy.value = story.id
  actionError.value = ''
  try {
    await $fetch(`/api/admin/stories/${story.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e) {
    actionError.value = apiError(e)
  } finally {
    busy.value = null
  }
}

const color = (s: string) => s === 'featured' ? 'success' : s === 'hidden' ? 'warning' : 'neutral'

useSeoMeta({ title: 'Stories · Admin', robots: 'noindex' })
</script>

<template>
  <AdminShell
    title="Stories"
    description="Stories go live when they are posted. Hide anything that should not be there; feature the ones that should be first."
  >
    <UAlert
      v-if="error || actionError"
      color="error"
      variant="subtle"
      :title="actionError || apiError(error)"
      class="mb-4"
    />

    <USkeleton
      v-if="status === 'pending' && !data"
      class="h-64 w-full"
    />

    <p
      v-else-if="!data?.items.length"
      class="text-muted"
    >
      No stories yet.
    </p>

    <ul
      v-else
      class="divide-y divide-default border border-default rounded-lg"
    >
      <li
        v-for="s in data.items"
        :key="s.id"
        class="p-4 flex flex-wrap gap-4"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <UBadge
              :color="color(s.status)"
              variant="subtle"
              size="sm"
            >
              {{ s.status }}
            </UBadge>
            <UBadge
              v-if="s.sample"
              color="warning"
              variant="subtle"
              size="sm"
            >
              Sample
            </UBadge>
            <NuxtLink
              :to="`/stories/${s.id}`"
              class="font-semibold text-highlighted hover:text-primary truncate"
            >
              {{ s.title }}
            </NuxtLink>
          </div>
          <p class="mt-1 text-xs text-muted">
            {{ s.author.name }} ({{ s.email || 'no email' }}) · {{ formatDay(s.createdAt) }} · {{ s.votes }} votes
          </p>
          <p class="mt-2 text-sm text-default line-clamp-2">
            {{ s.snippet }}
          </p>
        </div>
        <div class="flex flex-wrap items-start gap-2">
          <UButton
            v-if="s.status !== 'featured'"
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-star"
            :loading="busy === s.id"
            @click="setStatus(s, 'featured')"
          >
            Feature
          </UButton>
          <UButton
            v-if="s.status !== 'visible'"
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-eye"
            :loading="busy === s.id"
            @click="setStatus(s, 'visible')"
          >
            Show normally
          </UButton>
          <UButton
            v-if="s.status !== 'hidden'"
            size="sm"
            color="warning"
            variant="outline"
            icon="i-lucide-eye-off"
            :loading="busy === s.id"
            @click="setStatus(s, 'hidden')"
          >
            Hide
          </UButton>
          <UButton
            size="sm"
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            :loading="busy === s.id"
            @click="remove(s)"
          >
            Delete
          </UButton>
        </div>
      </li>
    </ul>
  </AdminShell>
</template>
