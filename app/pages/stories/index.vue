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
        icon="i-lucide-pen-line"
      >
        Share your story
      </UButton>
      <UButton
        to="/guestbook"
        color="neutral"
        variant="outline"
        icon="i-lucide-book-open-text"
      >
        Or just sign the guestbook
      </UButton>
    </template>

    <UTabs
      v-model="sort"
      :items="tabs"
      :content="false"
      class="mb-6 max-w-sm"
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
.stories-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
}
</style>
