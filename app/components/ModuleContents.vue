<script setup lang="ts">
import type { Lesson } from '~/utils/path'

/**
 * A list of lessons: one row each, between rules. Number, title and a line of
 * description, the minutes on the right, and a tick once it is finished.
 */
defineProps<{
  lessons: Lesson[]
  /** Show a running number down the left. */
  numbered?: boolean
}>()

const { isComplete } = useProgress()
const mounted = useMounted()
</script>

<template>
  <ol class="lessons row-list">
    <li
      v-for="(lesson, index) in lessons"
      :key="lesson.path"
    >
      <NuxtLink
        :to="lesson.path"
        class="lessons__row row-link"
        :data-numbered="numbered || undefined"
        :data-done="(mounted && isComplete(lesson.path)) || undefined"
      >
        <span
          v-if="numbered"
          class="lessons__n num"
        >{{ String(index + 1).padStart(2, '0') }}</span>

        <span class="lessons__main">
          <span class="lessons__title">{{ lesson.title }}</span>
          <span
            v-if="lesson.description"
            class="lessons__text"
          >{{ lesson.description }}</span>
        </span>

        <span class="lessons__side">
          <span
            v-if="lesson.kind && lesson.kind !== 'lesson'"
            class="label lessons__kind"
          >{{ lesson.kind }}</span>
          <span
            v-if="lesson.minutes"
            class="num"
          >{{ lesson.minutes }} min</span>
          <UIcon
            v-if="mounted && isComplete(lesson.path)"
            name="i-lucide-check"
            class="size-4 text-success"
            aria-label="Finished"
          />
        </span>
      </NuxtLink>
    </li>
  </ol>
</template>

<style scoped>
.lessons__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: baseline;
  padding: 0.75rem 0.5rem 0.75rem 0;
}

.lessons__row[data-numbered] {
  grid-template-columns: 2.5rem minmax(0, 1fr) auto;
}

.lessons__n {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ui-text-dimmed);
}

.lessons__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.lessons__title {
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.lessons__row:hover .lessons__title {
  color: var(--ui-primary);
}

.lessons__row[data-done] .lessons__title {
  color: var(--ui-text-muted);
}

.lessons__text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin-top: 0.125rem;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
}

.lessons__side {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: var(--text-xs);
  color: var(--ui-text-dimmed);
  white-space: nowrap;
}

.lessons__kind {
  display: none;
  font-size: 0.625rem;
}

@media (min-width: 640px) {
  .lessons__kind {
    display: inline-flex;
  }
}
</style>
