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
      <p class="story-card__route label">
        <span
          v-if="story.sample"
          class="story-card__flag"
        >Sample</span>
        <span
          v-if="story.featured"
          class="story-card__flag story-card__flag--featured"
        >Featured</span>
        <span class="story-card__place">{{ story.from }}</span>
        <UIcon
          name="i-lucide-arrow-right"
          class="size-3 shrink-0"
        />
        <span class="story-card__place">{{ story.to }}</span>
      </p>

      <h3 class="story-card__title">
        {{ story.title }}
      </h3>

      <p
        v-if="story.company || story.package"
        class="story-card__job"
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
        <span class="text-dimmed num shrink-0">{{ formatAgo(story.createdAt) }}</span>
        <span class="story-card__votes num">
          <UIcon
            name="i-lucide-heart"
            class="size-3.5"
          />
          {{ story.votes }}
          <span class="sr-only">votes</span>
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
/* A story on the grid: a rule on top, the photo, then the words. No box. */
.story-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 0.75rem;
  border-top: 2px solid var(--rule-strong);
  overflow-wrap: anywhere;
}

.story-card:focus-visible {
  outline: 2px solid var(--ui-text-highlighted);
  outline-offset: 4px;
}

.story-card__media {
  position: relative;
  aspect-ratio: 16 / 9;
  margin-bottom: 1rem;
  overflow: hidden;
  background: var(--ui-bg-muted);
}

.story-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--dgm-t-base) var(--dgm-ease);
}

.story-card:hover .story-card__media img {
  transform: scale(1.02);
}

.story-card__play {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 2.5rem;
  height: 2.5rem;
  color: white;
}

.story-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
}

.story-card__route {
  /* Wrap rather than chop: "Voice process, Indore" beats "VOICE PROC…". */
  flex-wrap: wrap;
  min-width: 0;
  gap: 0.375rem;
  row-gap: 0.125rem;
}

.story-card__place {
  min-width: 0;
  overflow-wrap: anywhere;
}

.story-card__flag {
  flex-shrink: 0;
  padding: 0.0625rem 0.3125rem;
  border: 1px solid var(--ui-border-accented);
  color: var(--ui-text-muted);
}

.story-card__flag--featured {
  border-color: var(--ui-primary);
  color: var(--ui-primary);
}

.story-card__title {
  font-size: var(--text-xl);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
  text-wrap: pretty;
}

.story-card:hover .story-card__title {
  color: var(--ui-primary);
}

.story-card__job {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ui-text);
}

.story-card__snippet {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
}

.story-card__foot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--rule-color);
  font-size: var(--text-xs);
  color: var(--ui-text-muted);
}

.story-card__votes {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
  flex-shrink: 0;
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .story-card:hover .story-card__media img {
    transform: none;
  }
}
</style>
