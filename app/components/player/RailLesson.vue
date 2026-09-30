<script setup lang="ts">
import type { Lesson } from '~/utils/path'

/**
 * One lesson on the sidebar timeline: a dot on the line, a tick once it is
 * finished, and a red square for the one you are reading.
 *
 * The link is always server-rendered, outside anything client-only, because
 * the prerender crawler finds lessons by following exactly these links.
 */
const props = defineProps<{
  lesson: Lesson
  active?: boolean
}>()

defineEmits<{ navigate: [] }>()

const { isComplete } = useProgress()
const mounted = useMounted()

const done = computed(() => mounted.value && isComplete(props.lesson.path))
</script>

<template>
  <NuxtLink
    :to="lesson.path"
    class="tl-row tl-lesson"
    :data-active="active || undefined"
    :data-done="done || undefined"
    :aria-current="active ? 'page' : undefined"
    @click="$emit('navigate')"
  >
    <span
      class="tl-node tl-lesson__node"
      aria-hidden="true"
    >
      <UIcon
        v-if="done"
        name="i-lucide-check"
        class="size-2.5"
      />
    </span>
    <span class="tl-lesson__title">{{ lesson.title }}</span>
    <span
      v-if="done"
      class="sr-only"
    >, finished</span>
    <span
      v-if="lesson.minutes"
      class="tl-lesson__min num"
    >{{ lesson.minutes }}m</span>
  </NuxtLink>
</template>

<style scoped>
.tl-lesson {
  align-items: flex-start;
  min-height: 1.875rem;
  padding-left: calc(var(--tl-text) + 0.25rem);
  font-size: 0.875rem;
}

.tl-lesson__title {
  flex: 1;
  min-width: 0;
}

.tl-lesson__node {
  top: 0.9375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.3125rem;
  height: 0.3125rem;
  border-radius: 999px;
  background: var(--ui-text-dimmed);
}

.tl-lesson[data-done] .tl-lesson__node {
  width: 0.875rem;
  height: 0.875rem;
  background: var(--ui-bg);
  border: 1px solid var(--ui-success);
  color: var(--ui-success);
}

.tl-lesson[data-done] {
  color: var(--ui-text-dimmed);
}

/* The lesson you are reading: the one red thing in the sidebar. */
.tl-lesson[data-active] {
  color: var(--ui-text-highlighted);
  font-weight: 600;
  background: var(--ui-bg-muted);
}

.tl-lesson[data-active]::before {
  content: '';
  position: absolute;
  inset-block: 0;
  right: 0;
  width: 2px;
  background: var(--ui-primary);
}

.tl-lesson[data-active] .tl-lesson__node {
  width: 0.5625rem;
  height: 0.5625rem;
  border-radius: 0;
  border: 0;
  background: var(--ui-primary);
  color: #fff;
}

.tl-lesson[data-active][data-done] .tl-lesson__node {
  width: 0.875rem;
  height: 0.875rem;
}

.tl-lesson__min {
  flex: none;
  margin-top: 0.0625rem;
  font-size: 0.6875rem;
  color: var(--ui-text-dimmed);
  opacity: 0;
  transition: opacity var(--dgm-t-fast) var(--dgm-ease);
}

.tl-lesson:hover .tl-lesson__min,
.tl-lesson[data-active] .tl-lesson__min {
  opacity: 1;
}
</style>
