<script setup lang="ts">
import type { PathCollectionItem } from '@nuxt/content'
import type { Stage } from '~/utils/path'
import { trackStyle } from '~/utils/tech'

defineProps<{
  page?: PathCollectionItem
}>()

const route = useRoute()

const { path } = usePath()
const { subject } = usePathPlayer(() => route.path)
const { subjectProgress, resume } = useProgress()

const progress = computed(() => subjectProgress(subject.value))
/** The same number the sidebar and the home page give this track. */
const number = computed(() => {
  for (const group of byStage(path.value)) {
    const index = group.subjects.findIndex(item => item.path === subject.value?.path)
    if (index >= 0) {
      return String(group.offset + index + 1).padStart(2, '0')
    }
  }
  return ''
})
const slug = computed(() => subject.value?.slug)
const color = computed(() => trackStyle(slug.value, subject.value?.icon).color)

const resumeTo = computed(() => resume(path.value, subject.value)?.path || subject.value?.lessons[0]?.path)
const resumeLabel = computed(() => {
  if (progress.value.finished) {
    return 'Review from the start'
  }
  return progress.value.started ? 'Continue' : 'Start this track'
})
</script>

<template>
  <div
    class="subject-head swiss-grid"
    :style="{ '--track': color }"
  >
    <div
      class="subject-head__art"
      aria-hidden="true"
    >
      <TrackIllustration :slug="slug" />
    </div>

    <p class="subject-head__kicker label">
      <span
        class="subject-head__swatch"
        aria-hidden="true"
      />
      <span
        v-if="number"
        class="num"
      >Track {{ number }}</span>
      <template v-if="page?.stage">
        <span aria-hidden="true">·</span>
        {{ stageLabels[page.stage as Stage] }}
      </template>
    </p>

    <h1 class="subject-head__title display">
      {{ page?.title || subject?.title }}
    </h1>

    <p
      v-if="page?.description || subject?.description"
      class="subject-head__lede lede"
    >
      {{ page?.description || subject?.description }}
    </p>

    <dl class="subject-head__facts">
      <div v-if="subject?.lessons.length">
        <dt class="label">
          Lessons
        </dt>
        <dd class="num">
          {{ subject.lessons.length }}
        </dd>
      </div>
      <div v-if="subject?.modules.length">
        <dt class="label">
          Chapters
        </dt>
        <dd class="num">
          {{ subject.modules.length }}
        </dd>
      </div>
      <div v-if="subject?.minutes">
        <dt class="label">
          Reading
        </dt>
        <dd class="num">
          {{ formatMinutes(subject.minutes) }}
        </dd>
      </div>
      <div v-if="page?.duration">
        <dt class="label">
          Takes
        </dt>
        <dd>{{ page.duration }}</dd>
      </div>
    </dl>

    <div class="subject-head__actions">
      <ClientOnly>
        <UButton
          :to="resumeTo"
          :label="resumeLabel"
          trailing-icon="i-lucide-arrow-right"
          size="lg"
        />
        <template #fallback>
          <UButton
            :to="subject?.lessons[0]?.path"
            label="Start this track"
            trailing-icon="i-lucide-arrow-right"
            size="lg"
          />
        </template>
      </ClientOnly>

      <ClientOnly>
        <PlayerProgress
          v-if="progress.started"
          :progress="progress"
          :label="`${progress.completed} of ${progress.total} finished`"
          class="subject-head__progress"
        />
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.subject-head {
  position: relative;
}

.subject-head > * {
  grid-column: 1 / -1;
}

/* The track's line drawing: absolute on the right, so the hero band keeps
   exactly the height its words give it. Wide screens only. */
.subject-head__art {
  display: none;
}

@media (min-width: 1024px) {
  .subject-head__art {
    display: block;
    position: absolute;
    inset-block: 0;
    right: 0;
    width: calc(33.333% - 0.667 * var(--gutter));
    max-width: 16rem;
    pointer-events: none;
  }
}

.subject-head__swatch {
  width: 0.625rem;
  height: 0.625rem;
  background: var(--track);
}

.subject-head__title {
  margin-top: 1.25rem;
}

.subject-head__lede {
  margin-top: 1.25rem;
}

.subject-head__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 2.5rem;
  border-top: 1px solid var(--rule-color);
}

.subject-head__facts > div {
  padding: 0.75rem 1rem 0.75rem 0;
  border-bottom: 1px solid var(--rule-color);
}

.subject-head__facts dd {
  margin-top: 0.375rem;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--ui-text-highlighted);
}

.subject-head__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem 2rem;
  margin-top: 2rem;
}

.subject-head__progress {
  width: 100%;
  max-width: 16rem;
}

@media (min-width: 640px) {
  .subject-head__facts {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .subject-head__facts > div + div {
    padding-left: 1rem;
    border-left: 1px solid var(--rule-color);
  }
}

@media (min-width: 1024px) {
  .subject-head__title {
    grid-column: 1 / span 8;
  }

  .subject-head__lede {
    grid-column: 1 / span 7;
  }

  .subject-head__facts {
    grid-column: 1 / span 8;
  }
}
</style>
