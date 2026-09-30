<script setup lang="ts">
/**
 * One story, in full. Rendered by the Worker per request so that a shared link
 * arrives with its title and text already in the page. Every field is plain
 * text and is rendered escaped; line breaks are kept with `white-space`.
 */
interface Story {
  id: number
  title: string
  from: string
  to: string
  company: string | null
  package: string | null
  body: string
  media: { kind: 'image' | 'video' | 'youtube', url: string }[]
  votes: number
  featured: boolean
  hidden: boolean
  voted: boolean
  mine: boolean
  author: { name: string, image: string | null }
  createdAt: string
}

const route = useRoute()
const id = computed(() => String(route.params.id))
const { loggedIn } = useUser()

const { data: story, error, refresh } = await useFetch<Story>(() => `/api/stories/${id.value}`)

if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Story not found', fatal: true })
}

// The server render has no idea who is reading; ask again in the browser so
// "you voted" is right.
onMounted(() => {
  refresh()
})

const voting = ref(false)
const voteError = ref('')

async function vote() {
  voteError.value = ''
  if (!loggedIn.value) {
    await navigateTo({ path: '/login', query: { next: route.fullPath } })
    return
  }
  voting.value = true
  try {
    const result = await $fetch<{ voted: boolean, votes: number }>(`/api/stories/${id.value}/vote`, { method: 'POST' })
    if (story.value) {
      story.value.voted = result.voted
      story.value.votes = result.votes
    }
  } catch (e) {
    voteError.value = apiError(e)
  } finally {
    voting.value = false
  }
}

const origin = useRequestURL().origin
const image = computed(() => story.value?.media.find(m => m.kind === 'image')?.url)

const description = computed(() => story.value
  ? `${story.value.from} to ${story.value.to}. ${story.value.body.replace(/\s+/g, ' ').slice(0, 150)}`
  : undefined)

useSeoMeta({
  title: () => story.value?.title || 'A story',
  description,
  ogTitle: () => story.value?.title,
  ogDescription: description,
  ogType: 'article',
  ogImage: () => (image.value ? `${origin}${image.value}` : undefined),
  robots: () => (story.value?.hidden ? 'noindex' : undefined)
})
</script>

<template>
  <CommunityPage
    v-if="story"
    :kicker="story.featured ? 'Featured story' : 'A story'"
    :icon="story.featured ? 'i-lucide-star' : 'i-lucide-footprints'"
    :title="story.title"
  >
    <UAlert
      v-if="story.hidden"
      color="warning"
      variant="subtle"
      icon="i-lucide-eye-off"
      title="This story is hidden"
      description="Only you and the admins can see it."
      class="mb-6"
    />

    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
      <UAvatar
        :src="story.author.image || undefined"
        :alt="story.author.name"
        size="sm"
      />
      <span class="font-medium text-highlighted">{{ story.author.name }}</span>
      <span>· {{ formatDay(story.createdAt) }}</span>
    </div>

    <dl class="story-facts">
      <div>
        <dt>Started</dt>
        <dd>{{ story.from }}</dd>
      </div>
      <div>
        <dt>Now</dt>
        <dd>{{ story.to }}</dd>
      </div>
      <div v-if="story.company">
        <dt>Company</dt>
        <dd>{{ story.company }}</dd>
      </div>
      <div v-if="story.package">
        <dt>Package</dt>
        <dd>{{ story.package }}</dd>
      </div>
    </dl>

    <div
      v-if="story.media.length"
      class="story-media"
    >
      <template
        v-for="m in story.media"
        :key="m.url"
      >
        <img
          v-if="m.kind === 'image'"
          :src="m.url"
          :alt="`From ${story.author.name}'s story`"
          loading="lazy"
          decoding="async"
        >
        <video
          v-else-if="m.kind === 'video'"
          :src="m.url"
          controls
          preload="metadata"
          playsinline
        />
        <iframe
          v-else-if="youtubeEmbed(m.url)"
          :src="youtubeEmbed(m.url)!"
          title="YouTube video"
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
        />
      </template>
    </div>

    <div class="story-body">
      {{ story.body }}
    </div>

    <div class="mt-8 flex flex-wrap items-center gap-3">
      <UButton
        :icon="story.voted ? 'i-lucide-heart-handshake' : 'i-lucide-heart'"
        :variant="story.voted ? 'solid' : 'outline'"
        :loading="voting"
        @click="vote"
      >
        {{ story.voted ? 'You found this inspiring' : 'This inspired me' }} · {{ story.votes }}
      </UButton>
      <UButton
        to="/stories"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
      >
        All stories
      </UButton>
      <span
        v-if="voteError"
        class="text-sm text-error"
      >{{ voteError }}</span>
    </div>

    <section class="story-next">
      <p class="headline">
        Got somewhere yourself?
      </p>
      <p class="mt-2 text-muted">
        Your story is the thing that tells the next person it can be done.
      </p>
      <UButton
        to="/stories/new"
        class="mt-5"
      >
        Share your story
      </UButton>
    </section>
  </CommunityPage>
</template>

<style scoped>
/* The facts of a story as a ruled table: started, now, company, package. */
.story-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 2rem;
  border-top: 2px solid var(--rule-strong);
}

@media (min-width: 640px) {
  .story-facts {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.story-facts > div {
  min-width: 0;
  padding: 0.75rem 0.75rem 0.875rem 0;
  border-bottom: 1px solid var(--rule-color);
}

.story-facts dt {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.story-facts dd {
  margin-top: 0.375rem;
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.25;
  color: var(--ui-text-highlighted);
  overflow-wrap: anywhere;
}

.story-media {
  display: grid;
  gap: var(--gutter);
  margin-top: 2rem;
}

.story-media img,
.story-media video,
.story-media iframe {
  width: 100%;
  background: var(--ui-bg-accented);
}

.story-media iframe {
  aspect-ratio: 16 / 9;
  border: 0;
}

.story-body {
  max-width: var(--guide-measure);
  margin-top: 2rem;
  font-size: 1.125rem;
  line-height: 1.75;
  white-space: pre-line;
  overflow-wrap: anywhere;
  color: var(--ui-text);
}

.story-next {
  margin-top: 4rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--rule-color);
}
</style>
