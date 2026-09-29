<script setup lang="ts">
/**
 * Your account: who you are signed in as, everything you have written, and the
 * button that deletes all of it.
 */
definePageMeta({ middleware: 'auth' })

interface AccountData {
  user: { id: string, name: string, email: string, image: string | null, isAdmin: boolean }
  stories: { id: number, title: string, status: string, votes: number, createdAt: string }[]
  comments: { id: number, path: string, body: string, createdAt: string }[]
  guestbook: { id: number, message: string, createdAt: string }[]
}

const { signOut, user } = useUser()
const { data, status, error } = useFetch<AccountData>('/api/account', { server: false, lazy: true })

const confirmOpen = ref(false)
const confirmText = ref('')
const deleting = ref(false)
const deleteError = ref('')

async function leave() {
  await signOut()
  await navigateTo('/')
}

async function destroy() {
  deleteError.value = ''
  deleting.value = true
  try {
    await $fetch('/api/account', { method: 'DELETE', query: { confirm: confirmText.value } })
    user.value = null
    await signOut().catch(() => {})
    await navigateTo('/?deleted=1')
  } catch (e) {
    deleteError.value = apiError(e)
  } finally {
    deleting.value = false
  }
}

const statusColor = (s: string) => s === 'featured' ? 'success' : s === 'hidden' ? 'warning' : 'neutral'

useSeoMeta({ title: 'Your account', robots: 'noindex' })
</script>

<template>
  <CommunityPage
    kicker="Your account"
    icon="i-lucide-user-round"
    title="Your account"
  >
    <div
      v-if="status === 'pending' || status === 'idle'"
      class="space-y-4"
    >
      <USkeleton class="h-20 w-full" />
      <USkeleton class="h-40 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      :title="apiError(error)"
    />

    <div
      v-else-if="data"
      class="space-y-8"
    >
      <UCard>
        <div class="flex flex-wrap items-center gap-4">
          <UAvatar
            :src="data.user.image || undefined"
            :alt="data.user.name"
            size="xl"
          />
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-highlighted">
              {{ data.user.name }}
            </p>
            <p class="text-sm text-muted truncate">
              {{ data.user.email }}
            </p>
          </div>
          <div class="flex gap-2">
            <UButton
              v-if="data.user.isAdmin"
              to="/admin"
              icon="i-lucide-gauge"
              color="neutral"
              variant="outline"
            >
              Admin
            </UButton>
            <UButton
              icon="i-lucide-log-out"
              color="neutral"
              variant="ghost"
              @click="leave"
            >
              Sign out
            </UButton>
          </div>
        </div>
        <p class="mt-4 text-sm text-muted">
          Your name and picture come from the account you signed in with. They
          appear next to your stories, comments and guestbook entries.
        </p>
      </UCard>

      <section>
        <div class="flex items-center justify-between gap-4 mb-3">
          <h2 class="text-lg font-semibold text-highlighted">
            Your stories
          </h2>
          <UButton
            to="/stories/new"
            size="sm"
            icon="i-lucide-plus"
          >
            Share a story
          </UButton>
        </div>
        <p
          v-if="!data.stories.length"
          class="text-sm text-muted"
        >
          You have not shared one yet. If this guide helped you get somewhere, I
          would love to read how.
        </p>
        <ul
          v-else
          class="divide-y divide-default border border-default rounded-lg"
        >
          <li
            v-for="s in data.stories"
            :key="s.id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <NuxtLink
              :to="`/stories/${s.id}`"
              class="min-w-0 flex-1 truncate font-medium text-highlighted hover:text-primary"
            >
              {{ s.title }}
            </NuxtLink>
            <UBadge
              :color="statusColor(s.status)"
              variant="subtle"
              size="sm"
            >
              {{ s.status }}
            </UBadge>
            <span class="text-sm text-muted tabular-nums">{{ s.votes }} votes</span>
          </li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-highlighted mb-3">
          Your comments
        </h2>
        <p
          v-if="!data.comments.length"
          class="text-sm text-muted"
        >
          None yet.
        </p>
        <ul
          v-else
          class="space-y-3"
        >
          <li
            v-for="c in data.comments"
            :key="c.id"
            class="text-sm"
          >
            <NuxtLink
              :to="c.path"
              class="text-primary"
            >
              {{ c.path }}
            </NuxtLink>
            <span class="text-dimmed"> · {{ formatAgo(c.createdAt) }}</span>
            <p class="mt-1 text-default whitespace-pre-line line-clamp-3">
              {{ c.body }}
            </p>
          </li>
        </ul>
      </section>

      <section v-if="data.guestbook.length">
        <h2 class="text-lg font-semibold text-highlighted mb-3">
          Your guestbook entries
        </h2>
        <ul class="space-y-2 text-sm">
          <li
            v-for="g in data.guestbook"
            :key="g.id"
          >
            <span class="text-dimmed">{{ formatDay(g.createdAt) }}</span>
            <p class="whitespace-pre-line">
              {{ g.message }}
            </p>
          </li>
        </ul>
      </section>

      <UCard
        :ui="{ root: 'ring-error/40' }"
        class="border-error/40"
      >
        <h2 class="font-semibold text-highlighted">
          Delete my account
        </h2>
        <p class="mt-2 text-sm text-muted">
          This removes your account and everything you wrote here: your
          stories and their photos and videos, your votes, your comments and
          your guestbook entries. It cannot be undone. Payments and sponsor
          bids are kept as financial records, without your account attached.
        </p>
        <UButton
          class="mt-4"
          color="error"
          variant="outline"
          icon="i-lucide-trash-2"
          @click="confirmOpen = true"
        >
          Delete my account
        </UButton>
      </UCard>
    </div>

    <UModal
      v-model:open="confirmOpen"
      title="Delete everything?"
      description="Type DELETE to confirm. There is no undo."
    >
      <template #body>
        <UInput
          v-model="confirmText"
          placeholder="DELETE"
          class="w-full"
          autofocus
        />
        <p
          v-if="deleteError"
          class="mt-3 text-sm text-error"
        >
          {{ deleteError }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            color="neutral"
            variant="ghost"
            @click="confirmOpen = false"
          >
            Keep my account
          </UButton>
          <UButton
            color="error"
            :loading="deleting"
            :disabled="confirmText !== 'DELETE'"
            @click="destroy"
          >
            Delete it all
          </UButton>
        </div>
      </template>
    </UModal>
  </CommunityPage>
</template>
