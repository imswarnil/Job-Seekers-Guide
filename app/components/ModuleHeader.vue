<script setup lang="ts">
import type { PathCollectionItem } from '@nuxt/content'
import { trackStyle } from '~/utils/tech'

defineProps<{
  page?: PathCollectionItem
}>()

const route = useRoute()

const { subject, module } = usePathPlayer(() => route.path)
const { moduleProgress, isComplete } = useProgress()

const progress = computed(() => moduleProgress(module.value))
const slug = computed(() => subject.value?.slug)
const color = computed(() => trackStyle(slug.value, subject.value?.icon).color)

const number = computed(() => {
  const index = subject.value?.modules.findIndex(item => item.path === module.value?.path) ?? -1
  return index >= 0 ? String(index + 1).padStart(2, '0') : ''
})

const start = computed(() =>
  module.value?.lessons.find(lesson => !isComplete(lesson.path)) || module.value?.lessons[0]
)
</script>

<template>
  <div
    class="module-head swiss-grid"
    :style="{ '--track': color }"
  >
    <div
      class="module-head__art"
      aria-hidden="true"
    >
      <TrackIllustration :slug="slug" />
    </div>

    <p class="module-head__kicker label">
      <NuxtLink
        v-if="subject"
        :to="subject.path"
        class="module-head__crumb"
      >
        <span
          class="module-head__swatch"
          aria-hidden="true"
        />
        {{ subject.title }}
      </NuxtLink>
      <template v-if="number">
        <span aria-hidden="true">/</span>
        <span class="num">Chapter {{ number }}</span>
      </template>
    </p>

    <h1 class="module-head__title display">
      {{ page?.title || module?.title }}
    </h1>

    <p
      v-if="page?.description || module?.description"
      class="module-head__lede lede"
    >
      {{ page?.description || module?.description }}
    </p>

    <div class="module-head__foot">
      <dl class="module-head__facts">
        <div>
          <dt class="label">
            Lessons
          </dt>
          <dd class="num">
            {{ module?.lessons.length }}
          </dd>
        </div>
        <div v-if="module?.minutes">
          <dt class="label">
            Reading
          </dt>
          <dd class="num">
            {{ formatMinutes(module.minutes) }}
          </dd>
        </div>
      </dl>

      <UButton
        v-if="start"
        :to="start.path"
        label="Start this chapter"
        trailing-icon="i-lucide-arrow-right"
        size="lg"
      />

      <ClientOnly>
        <PlayerProgress
          v-if="progress.started"
          :progress="progress"
          class="module-head__progress"
        />
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.module-head {
  position: relative;
}

.module-head > * {
  grid-column: 1 / -1;
}

/* The track's line drawing, same treatment as the track page: absolute on the
   right so the band never grows for it, wide screens only. */
.module-head__art {
  display: none;
}

@media (min-width: 1024px) {
  .module-head__art {
    display: block;
    position: absolute;
    inset-block: 0;
    right: 0;
    width: calc(33.333% - 0.667 * var(--gutter));
    max-width: 16rem;
    pointer-events: none;
  }
}

.module-head__kicker {
  flex-wrap: wrap;
}

.module-head__crumb {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ui-text-muted);
}

.module-head__crumb:hover {
  color: var(--ui-text-highlighted);
}

.module-head__swatch {
  width: 0.625rem;
  height: 0.625rem;
  background: var(--track);
}

.module-head__title {
  margin-top: 1.25rem;
}

.module-head__lede {
  margin-top: 1.25rem;
}

.module-head__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1.5rem 2.5rem;
  margin-top: 2.5rem;
}

.module-head__facts {
  display: flex;
  gap: 2.5rem;
}

.module-head__facts dd {
  margin-top: 0.375rem;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--ui-text-highlighted);
}

.module-head__progress {
  width: 100%;
  max-width: 16rem;
}

@media (min-width: 1024px) {
  .module-head__title {
    grid-column: 1 / span 8;
  }

  .module-head__lede {
    grid-column: 1 / span 7;
  }
}
</style>
