<script setup lang="ts">
import type { Lesson } from '~/utils/path'

/**
 * The lesson bar, fixed to the bottom of the content pane.
 *
 *   ← Previous        LESSON 42 OF 418        [Mark as finished] [Next →]
 *     its title       ──────────■────────────                     its title
 *
 * Moving on is the single most important action in the app (it is how a
 * curriculum gets finished), so it is always in reach and it is the one red
 * thing on the bar. The thin line along the top edge is where this lesson
 * sits on the whole path.
 */
const props = defineProps<{
  previous?: Lesson
  next?: Lesson
  crossesSubject?: boolean
  position: { n: number, total: number }
}>()

const route = useRoute()
const { isComplete, toggleComplete } = useProgress()
const mounted = useMounted()

const complete = computed(() => mounted.value && isComplete(route.path))
const percent = computed(() => props.position.total ? (props.position.n / props.position.total) * 100 : 0)
</script>

<template>
  <nav
    class="pager"
    aria-label="Lessons"
    :style="{ '--pct': `${percent}%` }"
  >
    <div
      class="pager__line"
      aria-hidden="true"
    />

    <NuxtLink
      v-if="previous"
      :to="previous.path"
      class="pager__prev"
      :aria-label="`Previous lesson: ${previous.title}`"
    >
      <UIcon
        name="i-lucide-arrow-left"
        class="size-4 shrink-0"
      />
      <span class="pager__text">
        <span class="label">Previous</span>
        <span class="pager__title">{{ previous.title }}</span>
      </span>
    </NuxtLink>
    <span
      v-else
      class="pager__prev pager__prev--none"
    />

    <p class="pager__where num">
      <span class="pager__where-long">Lesson {{ position.n }} of {{ position.total }}</span>
      <span
        class="pager__where-short"
        aria-hidden="true"
      >{{ position.n }}/{{ position.total }}</span>
    </p>

    <div class="pager__end">
      <button
        type="button"
        class="pager__done"
        :aria-pressed="complete"
        :data-done="complete || undefined"
        :title="complete ? 'Finished. Press to undo' : 'Mark as finished (M)'"
        @click="toggleComplete(route.path)"
      >
        <UIcon
          :name="complete ? 'i-lucide-circle-check' : 'i-lucide-circle'"
          class="size-4 shrink-0"
        />
        <span class="pager__done-text">{{ complete ? 'Finished' : 'Mark as finished' }}</span>
      </button>

      <NuxtLink
        :to="next?.path || '/'"
        class="pager__next"
        :aria-label="next ? `Next lesson: ${next.title}` : 'That was the last lesson. Back to the start'"
      >
        <span class="pager__text">
          <span class="label">{{ next ? (crossesSubject ? 'Next track' : 'Next') : 'Finished' }}</span>
          <span class="pager__title">{{ next ? (crossesSubject ? next.subjectTitle : next.title) : 'The end of the guide' }}</span>
        </span>
        <UIcon
          :name="next ? 'i-lucide-arrow-right' : 'i-lucide-flag'"
          class="size-4 shrink-0"
        />
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.pager {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: stretch;
  height: var(--pager-h);
  border-top: 1px solid var(--rule-color);
  background: var(--ui-bg);
}

/* Where this lesson sits on the whole path: a 2px line in ink over the rule. */
.pager__line {
  position: absolute;
  left: 0;
  top: -1px;
  height: 2px;
  width: var(--pct);
  background: var(--ui-text-highlighted);
  transition: width var(--dgm-t-base) var(--dgm-ease);
}

.pager__prev,
.pager__next {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  padding-inline: 0.875rem;
  transition:
    background-color var(--dgm-t-fast) var(--dgm-ease),
    color var(--dgm-t-fast) var(--dgm-ease);
}

.pager__prev {
  color: var(--ui-text-muted);
}

.pager__prev:hover {
  color: var(--ui-text-highlighted);
  background: var(--ui-bg-muted);
}

.pager__text {
  display: none;
  flex-direction: column;
  min-width: 0;
}

.pager__text .label {
  font-size: 0.625rem;
  color: inherit;
  opacity: 0.8;
}

.pager__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.25;
}

.pager__where {
  display: flex;
  align-items: center;
  padding-inline: 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-text-muted);
  white-space: nowrap;
}

.pager__where-long {
  display: none;
}

.pager__end {
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.pager__done {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: none;
  padding-inline: 0.875rem;
  border-left: 1px solid var(--rule-color);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ui-text-muted);
  transition:
    background-color var(--dgm-t-fast) var(--dgm-ease),
    color var(--dgm-t-fast) var(--dgm-ease);
}

.pager__done:hover {
  color: var(--ui-text-highlighted);
  background: var(--ui-bg-muted);
}

.pager__done[data-done] {
  color: var(--ui-success);
}

.pager__done-text {
  display: none;
}

/* Next: the one red cell. */
.pager__next {
  flex: none;
  justify-content: flex-end;
  max-width: 100%;
  background: var(--color-guide-600);
  color: #fff;
  text-align: right;
}

.pager__next:hover {
  background: var(--color-guide-700);
}

.pager__next .label {
  color: #fff;
}

.pager__prev:focus-visible,
.pager__done:focus-visible,
.pager__next:focus-visible {
  outline: 2px solid var(--ui-text-highlighted);
  outline-offset: -4px;
}

.pager__next:focus-visible {
  outline-color: #fff;
}

@media (min-width: 640px) {
  .pager__done-text {
    display: inline;
  }
}

@media (min-width: 768px) {
  .pager__where-long {
    display: inline;
  }

  .pager__where-short {
    display: none;
  }

  .pager__prev,
  .pager__next {
    padding-inline: var(--margin);
  }

  .pager__text {
    display: flex;
  }

  .pager__next {
    flex: 0 1 auto;
    min-width: 0;
  }
}

@media (min-width: 1280px) {
  .pager__next {
    min-width: 16rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pager__line {
    transition: none;
  }
}
</style>
