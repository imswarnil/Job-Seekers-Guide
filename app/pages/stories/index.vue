<script setup lang="ts">
import type { StorySummary } from '~/components/StoryCard.vue'

/**
 * Stories from readers who made it. Two tabs: the most inspiring (by votes,
 * featured first) and the newest. Fetched in the browser, so the page itself
 * can be prerendered and a new story shows up without a rebuild.
 */
const route = useRoute()
const router = useRouter()

const sort = computed<'top' | 'new'>({
  get: () => (route.query.sort === 'new' ? 'new' : 'top'),
  set: value => router.replace({ query: { ...route.query, sort: value === 'top' ? undefined : value } })
})

const { data, status } = useFetch<{ items: StorySummary[] }>('/api/stories', {
  query: { sort },
  server: false,
  lazy: true,
  default: () => ({ items: [] })
})

const tabs = [
  { label: 'Most inspiring', value: 'top', icon: 'i-lucide-heart' },
  { label: 'New', value: 'new', icon: 'i-lucide-sparkles' }
]

usePageSeo({
  title: 'Stories from people who made it',
  description: 'Readers of the guide on where they started, where they are now and what got them there. Share yours.',
  headline: 'Stories'
})
</script>

<template>
  <CommunityPage
    width="wide"
    kicker="Stories"
    icon="i-lucide-footprints"
    title="Where they started, and where they are now"
    description="I wrote my route down so the next person would have one. These are the routes people took after reading it. Vote for the ones that moved you, and when your turn comes, add yours."
  >
    <template #actions>
      <UButton
        to="/stories/new"
        size="lg"
      >
        Share your story
      </UButton>
      <NuxtLink
        to="/guestbook"
        class="arrow-link"
      >
        Or just sign the guestbook
        <UIcon
          name="i-lucide-arrow-right"
          class="size-4"
        />
      </NuxtLink>
    </template>

    <UTabs
      v-model="sort"
      :items="tabs"
      :content="false"
      variant="link"
      color="neutral"
      class="mb-8 max-w-sm"
    />

    <div
      v-if="status === 'pending' || status === 'idle'"
      class="stories-grid"
    >
      <USkeleton
        v-for="n in 6"
        :key="n"
        class="h-72"
      />
    </div>

    <UEmpty
      v-else-if="!data?.items.length"
      icon="i-lucide-footprints"
      title="No stories yet"
      description="The first one could be yours. Where did you start, and where are you now?"
      :actions="[{ label: 'Share your story', to: '/stories/new', icon: 'i-lucide-pen-line' }]"
    />

    <div
      v-else
      class="stories-grid"
    >
      <StoryCard
        v-for="story in data.items"
        :key="story.id"
        :story="story"
      />
    </div>
  </CommunityPage>
</template>

<style scoped>
/* Stories on the grid: one column on a phone, two on a tablet, three on the
   twelve-column frame, a gutter apart with a rule on top of each. */
.stories-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 3rem var(--gutter);
}

@media (min-width: 640px) {
  .stories-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .stories-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
