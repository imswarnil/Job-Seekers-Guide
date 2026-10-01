<script setup lang="ts">
import type { CommentReactionState } from '~/components/CommentReactions.vue'
import { emptyReactions } from '~/components/CommentReactions.vue'

/**
 * Comments under a lesson. Anybody can read them; posting needs an account,
 * goes live straight away, and is capped at five per person per page (the
 * server enforces it; this only shows the count).
 *
 * Each comment carries its reactions (CommentReactions): counts for everyone,
 * a signed-in reader's own highlighted and toggled in place.
 *
 * Loaded in the browser when the section scrolls near, so a prerendered lesson
 * never waits on the database and a reader who never scrolls down costs nothing.
 */
const props = withDefaults(defineProps<{
  /** The page's route path, e.g. `/java/collections/hashmap` or `/stories/12`. */
  path: string
  /** The heading over the thread; the lesson wording by default. */
  title?: string
  /** The line under the heading. */
  intro?: string
  /** Offer a GIF with each comment (story threads); lessons leave it off. */
  gifs?: boolean
}>(), {
  title: 'Questions and notes',
  intro: 'Stuck on something here, or found a better way to say it? Leave it below for the next reader. I read these too.',
  gifs: false
})

interface Comment {
  id: number
  body: string
  gif?: string | null
  createdAt: string
  author: { name: string, image: string | null }
  mine: boolean
  sample?: boolean
  reactions?: CommentReactionState
}

interface CommentsResponse {
  items: Comment[]
  used: number
  limit: number
}

const { user, ready } = useUser()

const root = ref<HTMLElement | null>(null)
const data = ref<CommentsResponse | null>(null)
const loading = ref(false)
const failed = ref(false)
const body = ref('')
const gif = ref<string | null>(null)
const posting = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  failed.value = false
  try {
    const result = await $fetch<CommentsResponse>('/api/comments', { query: { path: props.path }, timeout: 8000 })
    for (const c of result.items) {
      c.reactions ||= emptyReactions()
    }
    data.value = result
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

let started = false
function start() {
  if (!started) {
    started = true
    load()
  }
}

onMounted(() => {
  if (!root.value || typeof IntersectionObserver === 'undefined') {
    start()
    return
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      observer.disconnect()
      start()
    }
  }, { rootMargin: '600px' })
  observer.observe(root.value)
  onBeforeUnmount(() => observer.disconnect())
})

// A new lesson in the same component instance: start over.
watch(() => props.path, () => {
  data.value = null
  body.value = ''
  error.value = ''
  started = false
  start()
})

// Signing in changes `used` and `mine`.
watch(user, () => {
  if (started) {
    load()
  }
})

const limit = computed(() => data.value?.limit ?? 5)
const used = computed(() => data.value?.used ?? 0)
const left = computed(() => Math.max(0, limit.value - used.value))

async function post() {
  error.value = ''
  if (body.value.trim().length < 2) {
    error.value = 'Write a little more first.'
    return
  }
  posting.value = true
  try {
    const result = await $fetch<{ comment: Comment, used: number, limit: number }>('/api/comments', {
      method: 'POST',
      body: { path: props.path, body: body.value, gif: props.gifs ? gif.value || undefined : undefined }
    })
    data.value = {
      items: [...(data.value?.items || []), { ...result.comment, reactions: result.comment.reactions || emptyReactions() }],
      used: result.used,
      limit: result.limit
    }
    body.value = ''
    gif.value = null
  } catch (e) {
    error.value = apiError(e)
  } finally {
    posting.value = false
  }
}
</script>

<template>
  <section
    ref="root"
    class="comments"
    aria-labelledby="comments-title"
  >
    <h2
      id="comments-title"
      class="comments__title"
    >
      {{ title }}
      <span
        v-if="data?.items.length"
        class="text-muted font-normal num"
      >{{ data.items.length }}</span>
    </h2>
    <p class="text-sm text-muted">
      {{ intro }}
    </p>

    <div
      v-if="loading && !data"
      class="mt-4 space-y-3"
    >
      <USkeleton class="h-14 w-full" />
      <USkeleton class="h-14 w-2/3" />
    </div>

    <p
      v-else-if="failed"
      class="mt-4 text-sm text-muted"
    >
      Comments could not load just now.
      <button
        type="button"
        class="text-primary"
        @click="load"
      >
        Try again
      </button>
    </p>

    <ol
      v-else-if="data?.items.length"
      class="comments__list row-list"
    >
      <li
        v-for="c in data.items"
        :key="c.id"
        class="comments__item"
      >
        <UAvatar
          :src="c.author.image || undefined"
          :alt="c.author.name"
          size="sm"
        />
        <div class="min-w-0 flex-1">
          <p class="comments__meta">
            <span class="font-semibold text-highlighted">{{ c.author.name }}</span>
            <span
              v-if="c.mine"
              class="label"
            >You</span>
            <span
              v-if="c.sample"
              class="label"
              title="A made-up example, shown until real comments arrive"
            >Sample</span>
            <span class="text-dimmed num">{{ formatAgo(c.createdAt) }}</span>
          </p>
          <p class="comments__body">
            {{ c.body }}
          </p>
          <img
            v-if="gifs && c.gif"
            :src="c.gif"
            alt=""
            loading="lazy"
            referrerpolicy="no-referrer"
            class="mt-2 max-h-44 max-w-full border border-default"
          >
          <CommentReactions
            v-model="c.reactions"
            :comment-id="c.id"
            :path="path"
          />
        </div>
      </li>
    </ol>

    <p
      v-else-if="data"
      class="mt-4 text-sm text-muted"
    >
      Nobody has said anything here yet.
    </p>

    <div class="mt-6">
      <div
        v-if="ready && !user"
        class="flex flex-wrap items-center gap-3"
      >
        <UButton
          :to="{ path: '/login', query: { next: `${path}#comments-title` } }"
          size="sm"
          icon="i-lucide-log-in"
        >
          Sign in to comment
        </UButton>
        <span class="text-xs text-muted">Reading never needs an account.</span>
      </div>

      <form
        v-else-if="user"
        class="space-y-3"
        @submit.prevent="post"
      >
        <UTextarea
          v-model="body"
          :rows="3"
          autoresize
          maxlength="1500"
          :disabled="left === 0"
          :placeholder="left === 0 ? 'You have used all your comments on this page.' : 'Your question or note…'"
          class="w-full"
        />
        <GifPicker
          v-if="gifs && left > 0"
          v-model="gif"
        />
        <div class="flex flex-wrap items-center gap-3">
          <UButton
            type="submit"
            size="sm"
            :loading="posting"
            :disabled="left === 0"
            icon="i-lucide-send"
          >
            Post
          </UButton>
          <span class="text-xs text-muted num">{{ used }} of {{ limit }} comments used on this page</span>
          <span
            v-if="error"
            class="text-xs text-error"
            role="alert"
          >{{ error }}</span>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.comments {
  margin-top: 3rem;
  padding-top: 1.25rem;
  border-top: 2px solid var(--rule-strong, var(--ui-text-highlighted));
}

.comments__title {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  margin-bottom: 0.25rem;
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ui-text-highlighted);
  scroll-margin-top: 5rem;
}

.comments__list {
  margin-top: 1.25rem;
}

.comments__item {
  display: flex;
  gap: 0.75rem;
  padding-block: 1rem;
}

.comments__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.625rem;
  font-size: 0.875rem;
}

.comments__body {
  margin-top: 0.25rem;
  font-size: 0.9375rem;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
