<script setup lang="ts">
import type { Lesson } from '~/utils/path'

/**
 * The countdown to the next lesson, when the reader has opted in to moving on
 * by themselves. A ruled row, not a card: what is next, how long, and "Stay".
 */
const props = defineProps<{
  previous?: Lesson
  next?: Lesson
  crossesSubject?: boolean
  /** Counting down to an automatic advance, when the reader opted in. */
  counting?: boolean
  seconds?: number
}>()

defineEmits<{ cancel: [] }>()

const remaining = defineModel<number>('remaining', { default: 0 })

const fraction = computed(() => props.seconds ? remaining.value / props.seconds : 0)
</script>

<template>
  <section
    v-if="next"
    class="up-next"
    aria-live="polite"
  >
    <p class="label">
      {{ crossesSubject ? `Next track · ${next.subjectTitle}` : 'Up next' }}
    </p>
    <NuxtLink
      :to="next.path"
      class="up-next__title"
    >
      {{ next.title }}
    </NuxtLink>
    <p
      v-if="next.description"
      class="up-next__text"
    >
      {{ next.description }}
    </p>

    <div
      v-if="counting"
      class="up-next__count"
    >
      <div
        class="up-next__line"
        :style="{ width: `${fraction * 100}%` }"
      />
      <span class="num text-sm text-muted">Moving on in {{ remaining }}s</span>
      <UButton
        label="Stay"
        size="xs"
        color="neutral"
        variant="outline"
        @click.stop.prevent="$emit('cancel')"
      />
    </div>
  </section>
</template>

<style scoped>
.up-next {
  padding-block: 1.25rem;
  border-block: 1px solid var(--rule-color);
}

.up-next__title {
  display: block;
  margin-top: 0.5rem;
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
}

.up-next__title:hover {
  color: var(--ui-primary);
}

.up-next__text {
  margin-top: 0.25rem;
  color: var(--ui-text-muted);
}

.up-next__count {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--rule-color);
}

.up-next__line {
  position: absolute;
  top: -1px;
  left: 0;
  height: 2px;
  background: var(--ui-primary);
  transition: width 1s linear;
}
</style>
