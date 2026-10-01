<script setup lang="ts">
import type { Lesson } from '~/utils/path'
import { trackSlug, trackStyle } from '~/utils/tech'

const props = defineProps<{
  title: string
  description?: string
  lesson?: Lesson
  minutes?: number
  kind?: string
}>()

const slug = computed(() => trackSlug(props.lesson?.subjectPath))
const color = computed(() => trackStyle(slug.value).color)
</script>

<template>
  <header class="lesson-head swiss-grid">
    <div
      class="lesson-head__art"
      aria-hidden="true"
    >
      <TrackIllustration :slug="slug" />
    </div>

    <nav
      class="lesson-head__crumbs"
      aria-label="Where this lesson sits"
    >
      <NuxtLink
        v-if="lesson?.subjectPath"
        :to="lesson.subjectPath"
        class="lesson-head__crumb"
        :style="{ '--track': color }"
      >
        <span
          class="lesson-head__swatch"
          aria-hidden="true"
        />
        {{ lesson.subjectTitle }}
      </NuxtLink>
      <template v-if="lesson?.modulePath">
        <span aria-hidden="true">/</span>
        <NuxtLink
          :to="lesson.modulePath"
          class="lesson-head__crumb"
        >
          {{ lesson.moduleTitle }}
        </NuxtLink>
      </template>
    </nav>

    <h1 class="lesson-head__title headline">
      {{ title }}
    </h1>

    <p
      v-if="description"
      class="lesson-head__lede lede"
    >
      {{ description }}
    </p>

    <dl
      v-if="minutes || kind"
      class="lesson-head__meta"
    >
      <div v-if="kind">
        <dt class="label">
          Kind
        </dt>
        <dd class="capitalize">
          {{ kind }}
        </dd>
      </div>
      <div v-if="minutes">
        <dt class="label">
          Reading
        </dt>
        <dd class="num">
          {{ minutes }} min
        </dd>
      </div>
    </dl>
  </header>
</template>

<style scoped>
.lesson-head {
  position: relative;
}

.lesson-head > * {
  grid-column: 1 / -1;
}

/* The track's line drawing: on the right, out of the layout entirely so the
   hero band never grows for it. Wide screens only. */
.lesson-head__art {
  display: none;
}

@media (min-width: 1024px) {
  .lesson-head__art {
    display: block;
    position: absolute;
    inset-block: 0;
    right: 0;
    width: calc(25% - 0.75 * var(--gutter));
    max-width: 13rem;
    pointer-events: none;
  }
}

.lesson-head__crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.lesson-head__crumb {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ui-text-muted);
  transition: color var(--dgm-t-fast) var(--dgm-ease);
}

.lesson-head__crumb:hover {
  color: var(--ui-text-highlighted);
}

.lesson-head__swatch {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--track);
}

.lesson-head__title {
  margin-top: 1.25rem;
  max-width: 22ch;
}

.lesson-head__lede {
  margin-top: 1rem;
}

.lesson-head__meta {
  display: flex;
  gap: 2.5rem;
  margin-top: 2rem;
  font-size: var(--text-sm);
  color: var(--ui-text-highlighted);
}

.lesson-head__meta dd {
  margin-top: 0.25rem;
}

@media (min-width: 1024px) {
  .lesson-head__title,
  .lesson-head__lede {
    grid-column: 1 / span 9;
  }
}
</style>
