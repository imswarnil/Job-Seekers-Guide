<script setup lang="ts">
/**
 * The guestbook. Say hello, add a GIF, and tell me one thing you learned here.
 * Reading needs nothing; signing needs an account (it is how I keep spam out).
 */
interface Entry {
  id: number
  name: string
  image: string | null
  message: string
  gif: string | null
  learned: string | null
  createdAt: string
}

const { user, ready } = useUser()
const route = useRoute()

const { data, status } = useFetch<{ items: Entry[] }>('/api/guestbook', {
  server: false,
  lazy: true,
  default: () => ({ items: [] })
})

const form = reactive({ name: '', message: '', learned: '', gif: null as string | null })
const saving = ref(false)
const error = ref('')
const done = ref(false)

watch(user, (u) => {
  if (u && !form.name) {
    form.name = u.name
  }
}, { immediate: true })

async function submit() {
  error.value = ''
  if (form.message.trim().length < 2) {
    error.value = 'Write a few words first.'
    return
  }
  saving.value = true
  try {
    const entry = await $fetch<Entry>('/api/guestbook', {
      method: 'POST',
      body: { name: form.name || undefined, message: form.message, learned: form.learned || undefined, gif: form.gif || undefined }
    })
    data.value = { items: [entry, ...(data.value?.items || [])] }
    form.message = ''
    form.learned = ''
    form.gif = null
    done.value = true
  } catch (e) {
    error.value = apiError(e)
  } finally {
    saving.value = false
  }
}

usePageSeo({
  title: 'The guestbook',
  description: 'Say hello, add a GIF, and tell me one thing you learned from the guide.',
  headline: 'Guestbook'
})
</script>

<template>
  <CommunityPage
    kicker="Guestbook"
    icon="i-lucide-book-open-text"
    title="Sign the guestbook"
    description="If the guide helped you, even a little, leave a line here. Tell me one thing you learned. I read every one of these, and on bad days they are the reason I keep writing."
  >
    <UCard class="mb-10">
      <template v-if="!ready">
        <USkeleton class="h-32 w-full" />
      </template>

      <div
        v-else-if="!user"
        class="flex flex-wrap items-center justify-between gap-4"
      >
        <p class="text-muted">
          Sign in to write in the guestbook. It keeps the spam out.
        </p>
        <UButton
          :to="{ path: '/login', query: { next: route.fullPath } }"
          icon="i-lucide-log-in"
        >
          Sign in
        </UButton>
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="submit"
      >
        <UFormField label="Your name">
          <UInput
            v-model="form.name"
            maxlength="60"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Your message"
          required
        >
          <UTextarea
            v-model="form.message"
            :rows="3"
            maxlength="500"
            autoresize
            placeholder="Hello from a PG in Marathahalli…"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="What did you learn here?"
          hint="Optional"
        >
          <UTextarea
            v-model="form.learned"
            :rows="2"
            maxlength="500"
            autoresize
            placeholder="That a walk-in is a numbers game, and how to read the aptitude round against a clock."
            class="w-full"
          />
        </UFormField>
        <GifPicker v-model="form.gif" />

        <p
          v-if="error"
          class="text-sm text-error"
          role="alert"
        >
          {{ error }}
        </p>
        <p
          v-else-if="done"
          class="text-sm text-success"
        >
          Thank you. It is up.
        </p>

        <UButton
          type="submit"
          :loading="saving"
          icon="i-lucide-send"
        >
          Sign the guestbook
        </UButton>
      </form>
    </UCard>

    <div
      v-if="status === 'pending' || status === 'idle'"
      class="space-y-4"
    >
      <USkeleton
        v-for="n in 4"
        :key="n"
        class="h-24 w-full"
      />
    </div>

    <UEmpty
      v-else-if="!data?.items.length"
      icon="i-lucide-book-open-text"
      title="Nobody has signed it yet"
      description="Be the first."
    />

    <ol
      v-else
      class="guestbook"
    >
      <li
        v-for="entry in data.items"
        :key="entry.id"
        class="guestbook__entry"
      >
        <UAvatar
          :src="entry.image || undefined"
          :alt="entry.name"
          size="md"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm">
            <span class="font-semibold text-highlighted">{{ entry.name }}</span>
            <span class="text-dimmed"> · {{ formatAgo(entry.createdAt) }}</span>
          </p>
          <p class="mt-1 whitespace-pre-line text-default">
            {{ entry.message }}
          </p>
          <p
            v-if="entry.learned"
            class="guestbook__learned"
          >
            <span class="guestbook__learned-label">Learned here</span>
            {{ entry.learned }}
          </p>
          <img
            v-if="entry.gif"
            :src="entry.gif"
            alt=""
            loading="lazy"
            referrerpolicy="no-referrer"
            class="mt-3 max-h-48 rounded-md"
          >
        </div>
      </li>
    </ol>

    <UCard class="mt-12">
      <p class="font-semibold text-highlighted">
        Want to do more than sign?
      </p>
      <p class="mt-1 text-sm text-muted">
        The guide is free and stays free. If it saved you a coaching fee, a
        small contribution keeps it online for the next person.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <UButton
          to="/support"
          icon="i-lucide-heart-handshake"
        >
          Support the guide
        </UButton>
        <UButton
          to="/stories/new"
          color="neutral"
          variant="outline"
          icon="i-lucide-pen-line"
        >
          Share your story
        </UButton>
      </div>
    </UCard>
  </CommunityPage>
</template>

<style scoped>
.guestbook {
  display: grid;
  gap: 1.25rem;
}

.guestbook__entry {
  display: flex;
  gap: 0.875rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--ui-border);
  overflow-wrap: anywhere;
}

.guestbook__learned {
  margin-top: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-left: 3px solid var(--ui-primary);
  background: var(--ui-bg-elevated);
  font-size: 0.9375rem;
  white-space: pre-line;
}

.guestbook__learned-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}
</style>
