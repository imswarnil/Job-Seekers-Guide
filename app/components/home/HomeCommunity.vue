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
  <div class="community-home">
    <!-- ── Stories ──────────────────────────────────────────────── -->
    <section
      class="swiss-grid"
      aria-labelledby="home-stories"
    >
      <header class="c-head">
        <p class="label">
          03
        </p>
        <h2
          id="home-stories"
          class="headline mt-3"
        >
          Latest stories
        </h2>
        <p class="c-lede">
          People who read this and got the job. Yours belongs here too.
        </p>
        <div class="c-actions">
          <UButton
            to="/stories/new"
            label="Share yours"
            size="sm"
          />
          <NuxtLink
            to="/stories"
            class="arrow-link"
          >
            All stories
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </NuxtLink>
        </div>
      </header>

      <div class="c-body">
        <div
          v-if="loading(storiesStatus)"
          class="c-cols"
        >
          <USkeleton
            v-for="i in 3"
            :key="i"
            class="h-56"
          />
        </div>
        <div
          v-else-if="latestStories.length"
          class="c-cols"
        >
          <StoryCard
            v-for="story in latestStories"
            :key="story.id"
            :story="story"
          />
        </div>
        <p
          v-else
          class="c-empty"
        >
          No stories yet. If this guide helped you get a job, I would love yours to be the first.
        </p>
      </div>
    </section>

    <!-- ── Guestbook ────────────────────────────────────────────── -->
    <section
      class="swiss-grid c-section"
      aria-labelledby="home-guestbook"
    >
      <header class="c-head">
        <p class="label">
          04
        </p>
        <h2
          id="home-guestbook"
          class="headline mt-3"
        >
          From the guestbook
        </h2>
        <p class="c-lede">
          A line from whoever passed through. I read every one.
        </p>
        <div class="c-actions">
          <NuxtLink
            to="/guestbook"
            class="arrow-link"
          >
            Sign the guestbook
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </NuxtLink>
        </div>
      </header>

      <div class="c-body">
        <div
          v-if="loading(guestbookStatus)"
          class="space-y-3"
        >
          <USkeleton
            v-for="i in 3"
            :key="i"
            class="h-20"
          />
        </div>
        <ul
          v-else-if="latestEntries.length"
          class="row-list"
        >
          <li
            v-for="entry in latestEntries"
            :key="entry.id"
          >
            <NuxtLink
              to="/guestbook"
              class="entry row-link"
            >
              <UAvatar
                :src="entry.image || undefined"
                :alt="entry.name"
                size="sm"
              />
              <span class="entry__main">
                <span class="entry__who">
                  <span class="font-semibold text-highlighted">{{ entry.name }}</span>
                  <span class="text-dimmed num"> · {{ formatAgo(entry.createdAt) }}</span>
                  <span
                    v-if="entry.sample"
                    class="label entry__sample"
                  >Sample</span>
                </span>
                <span class="entry__message">{{ entry.message }}</span>
              </span>
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
          class="c-empty"
        >
          Nobody has signed it yet. Be the first.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.c-section {
  margin-top: 5rem;
  padding-top: 5rem;
  border-top: 1px solid var(--rule-color);
}

.c-head,
.c-body {
  grid-column: 1 / -1;
  min-width: 0;
}

.c-body {
  margin-top: 2rem;
}

.c-lede {
  margin-top: 0.75rem;
  max-width: 30rem;
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.c-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.5rem;
  margin-top: 1.5rem;
}

@media (min-width: 1024px) {
  .c-head {
    grid-column: 1 / span 3;
  }

  .c-body {
    grid-column: 4 / -1;
    margin-top: 0;
  }
}

/* Three stories, three equal columns, one gutter apart. */
.c-cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2.5rem var(--gutter);
}

@media (min-width: 768px) {
  .c-cols {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.c-empty {
  padding-block: 1.25rem;
  border-block: 1px solid var(--rule-color);
  color: var(--ui-text-muted);
}

.entry {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 0.5rem 1rem 0;
  overflow-wrap: anywhere;
}

.entry__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.entry__who {
  font-size: var(--text-sm);
}

.entry__sample {
  margin-left: 0.5rem;
  font-size: 0.625rem;
}

.entry__message {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  margin-top: 0.25rem;
  color: var(--ui-text);
  white-space: pre-line;
}

.entry__gif {
  flex-shrink: 0;
  width: 5rem;
  height: 5rem;
  object-fit: cover;
}
</style>
