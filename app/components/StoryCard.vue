<script setup lang="ts">
/** One story in the list on /stories: who, from where to where, and a taste of it. */
export interface StorySummary {
  id: number
  title: string
  from: string
  to: string
  company: string | null
  package: string | null
  snippet?: string
  media: { kind: 'image' | 'video' | 'youtube', url: string }[]
  votes: number
  featured: boolean
  author: { name: string, image: string | null }
  createdAt: string
  /** Seeded example content, not a real reader's story. Optional: older API
   *  responses do not carry it. */
  sample?: boolean
}

const props = defineProps<{ story: StorySummary }>()

const thumb = computed(() => {
  const m = props.story.media[0]
  if (!m) {
    return null
  }
  if (m.kind === 'image') {
    return { src: m.url, video: false }
  }
  if (m.kind === 'youtube') {
    const src = youtubeThumb(m.url)
    return src ? { src, video: true } : null
  }
  return { src: null, video: true }
})
</script>

<template>
  <NuxtLink
    :to="`/stories/${story.id}`"
    class="story-card"
  >
    <div
      v-if="thumb"
      class="story-card__media"
    >
      <img
        v-if="thumb.src"
        :src="thumb.src"
        alt=""
        loading="lazy"
        decoding="async"
      >
      <UIcon
        v-if="thumb.video"
        name="i-lucide-circle-play"
        class="story-card__play"
      />
    </div>

    <div class="story-card__body">
      <div class="flex items-center gap-2 text-xs text-muted">
        <UBadge
          v-if="story.sample"
          color="neutral"
          variant="outline"
          size="sm"
        >
          Sample
        </UBadge>
        <UBadge
          v-if="story.featured"
          color="primary"
          variant="subtle"
          size="sm"
          icon="i-lucide-star"
        >
          Featured
        </UBadge>
        <span class="truncate">{{ story.from }}</span>
        <UIcon
          name="i-lucide-arrow-right"
          class="size-3 shrink-0"
        />
        <span class="truncate">{{ story.to }}</span>
      </div>

      <h3 class="story-card__title">
        {{ story.title }}
      </h3>

      <p
        v-if="story.company || story.package"
        class="text-sm font-medium text-default"
      >
        {{ [story.company, story.package].filter(Boolean).join(' · ') }}
      </p>

      <p
        v-if="story.snippet"
        class="story-card__snippet"
      >
        {{ story.snippet }}
      </p>

      <div class="story-card__foot">
        <UAvatar
          :src="story.author.image || undefined"
          :alt="story.author.name"
          size="2xs"
        />
        <span class="truncate">{{ story.author.name }}</span>
        <span class="text-dimmed">· {{ formatAgo(story.createdAt) }}</span>
        <span class="ml-auto inline-flex items-center gap-1 tabular-nums">
          <UIcon
            name="i-lucide-heart"
            class="size-3.5"
          />
          {{ story.votes }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.story-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-lg, 0.75rem);
  background: var(--ui-bg);
  transition: border-color 150ms ease, transform 150ms ease;
}

.story-card:hover {
  border-color: var(--ui-border-accented);
}

.story-card__media {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--ui-bg-accented);
}

.story-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-card__play {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 2.5rem;
  height: 2.5rem;
  color: white;
  filter: drop-shadow(0 1px 4px rgb(0 0 0 / 0.5));
}

.story-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.125rem 1.125rem;
}

.story-card__title {
  font-weight: 650;
  font-size: 1.0625rem;
  line-height: 1.3;
  color: var(--ui-text-highlighted);
  text-wrap: balance;
}

.story-card__snippet {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.story-card__foot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
}
</style>
