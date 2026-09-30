<script setup lang="ts">
import type { StorySummary } from '~/components/StoryCard.vue'

/**
 * The newest stories and the newest guestbook lines, three of each.
 *
 * Fetched in the browser, like every community read on a prerendered page. An
 * item the API marks `sample: true` is seeded example content, and says so with
 * a small badge; the flag is optional, so an older API that does not send it
 * shows everything as real.
 */
interface Entry {
  id: number
  name: string
  image: string | null
  message: string
  gif: string | null
  learned: string | null
  createdAt: string
  sample?: boolean
}

const { data: stories, status: storiesStatus } = useFetch<{ items: StorySummary[] }>('/api/stories', {
  query: { sort: 'new', limit: 3 },
  server: false,
  lazy: true,
  default: () => ({ items: [] })
})

const { data: guestbook, status: guestbookStatus } = useFetch<{ items: Entry[] }>('/api/guestbook', {
  query: { limit: 3 },
  server: false,
  lazy: true,
  default: () => ({ items: [] })
})

const latestStories = computed(() => (stories.value?.items || []).slice(0, 3))
const latestEntries = computed(() => (guestbook.value?.items || []).slice(0, 3))

const loading = (s: string) => s === 'pending' || s === 'idle'
</script>

<template>
  <div class="space-y-14">
    <!-- ── Stories ──────────────────────────────────────────────── -->
    <section aria-labelledby="home-stories">
      <div class="row-head">
        <div>
          <h2
            id="home-stories"
            class="section-title"
          >
            Latest stories
          </h2>
          <p class="section-lede">
            People who read this and got the job. Yours belongs here too.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton
            to="/stories/new"
            label="Share yours"
            icon="i-lucide-pen-line"
            size="sm"
          />
          <UButton
            to="/stories"
            label="All stories"
            trailing-icon="i-lucide-arrow-right"
            color="neutral"
            variant="outline"
            size="sm"
          />
        </div>
      </div>

      <div
        v-if="loading(storiesStatus)"
        class="row-grid"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-56"
        />
      </div>
      <div
        v-else-if="latestStories.length"
        class="row-grid"
      >
        <StoryCard
          v-for="story in latestStories"
          :key="story.id"
          :story="story"
        />
      </div>
      <p
        v-else
        class="row-empty"
      >
        No stories yet. If this guide helped you get a job, I would love yours to be the first.
      </p>
    </section>

    <!-- ── Guestbook ────────────────────────────────────────────── -->
    <section aria-labelledby="home-guestbook">
      <div class="row-head">
        <div>
          <h2
            id="home-guestbook"
            class="section-title"
          >
            From the guestbook
          </h2>
          <p class="section-lede">
            A line from whoever passed through. I read every one.
          </p>
        </div>
        <UButton
          to="/guestbook"
          label="Sign the guestbook"
          trailing-icon="i-lucide-arrow-right"
          color="neutral"
          variant="outline"
          size="sm"
        />
      </div>

      <div
        v-if="loading(guestbookStatus)"
        class="row-grid"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-36"
        />
      </div>
      <ul
        v-else-if="latestEntries.length"
        class="row-grid"
      >
        <li
          v-for="entry in latestEntries"
          :key="entry.id"
        >
          <NuxtLink
            to="/guestbook"
            class="entry card-hover"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <UAvatar
                :src="entry.image || undefined"
                :alt="entry.name"
                size="sm"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate font-semibold text-highlighted">{{ entry.name }}</span>
                <span class="block text-xs text-dimmed">{{ formatAgo(entry.createdAt) }}</span>
              </span>
              <UBadge
                v-if="entry.sample"
                color="neutral"
                variant="outline"
                size="sm"
              >
                Sample
              </UBadge>
            </div>
            <p class="entry__message">
              {{ entry.message }}
            </p>
            <img
              v-if="entry.gif"
              :src="entry.gif"
              alt=""
              loading="lazy"
              referrerpolicy="no-referrer"
              class="entry__gif"
            >
          </NuxtLink>
        </li>
      </ul>
      <p
        v-else
        class="row-empty"
      >
        Nobody has signed it yet. Be the first.
      </p>
    </section>
  </div>
</template>

<style scoped>
.row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.row-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
}

.row-empty {
  padding: 1.25rem;
  border: 1px dashed var(--ui-border-accented);
  color: var(--ui-text-muted);
}

.section-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ui-text-highlighted);
}

.section-lede {
  margin-top: 0.375rem;
  color: var(--ui-text-muted);
}

.entry {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  height: 100%;
  padding: 1rem;
  border: 1px solid var(--ui-border);
  background: var(--ui-bg);
  overflow-wrap: anywhere;
}

.entry__message {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  color: var(--ui-text);
  white-space: pre-line;
}

.entry__gif {
  max-height: 8rem;
  width: auto;
  max-width: 100%;
  align-self: flex-start;
}
</style>
