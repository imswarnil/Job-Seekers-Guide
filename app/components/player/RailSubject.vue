<script setup lang="ts">
import type { Subject } from '~/utils/path'
import { trackStyle } from '~/utils/tech'

/**
 * One track on the sidebar timeline. Its node is drawn in the track's colour
 * and says how far you are: hollow, a thick ring, or filled. The track you are
 * in opens to show its chapters, and the chapter you are in shows its lessons.
 */
const props = defineProps<{
  subject: Subject
  current?: string
  /** The track the reader is inside. It opens; the others stay one row. */
  expanded?: boolean
  index: number
}>()

defineEmits<{ navigate: [] }>()

const { subjectProgress } = useProgress()

// Progress lives in localStorage. Until mount, draw what the prerendered HTML
// drew (not started), so hydration agrees; then the real state patches in.
const mounted = useMounted()
const progress = computed(() => subjectProgress(props.subject))
const status = computed(() => {
  if (!mounted.value || !progress.value.started) {
    return 'todo'
  }
  return progress.value.finished ? 'done' : 'doing'
})

const statusText = computed(() => ({
  todo: 'not started',
  doing: `${progress.value.completed} of ${progress.value.total} finished`,
  done: 'finished'
})[status.value])

const style = computed(() => trackStyle(props.subject.slug, props.subject.icon))
const color = computed(() => style.value.color)

const open = ref(props.expanded)
watch(() => props.expanded, (value) => {
  if (value) {
    open.value = true
  }
})

/** The chapter the reader is in: the one whose lessons are listed. */
const activeModule = computed(() => {
  if (!props.current) {
    return undefined
  }
  return props.subject.modules.find(module =>
    module.path === props.current || module.lessons.some(lesson => lesson.path === props.current)
  )?.path
})

/** Chapters opened or shut by hand. Unset follows the active chapter. */
const override = ref<Record<string, boolean>>({})

function shown(path: string) {
  return override.value[path] ?? path === activeModule.value
}

function toggleModule(path: string) {
  override.value = { ...override.value, [path]: !shown(path) }
}

watch(activeModule, () => {
  override.value = {}
})

const here = computed(() => props.current === props.subject.path)
</script>

<template>
  <div
    class="tl-track"
    :data-status="status"
    :data-open="open || undefined"
    :data-current="expanded || undefined"
    :style="{ '--track': color }"
  >
    <div class="tl-track__head">
      <NuxtLink
        :to="subject.path"
        class="tl-row tl-track__link"
        :aria-current="here ? 'page' : undefined"
        :data-active="here || undefined"
        @click="$emit('navigate')"
      >
        <span
          class="tl-node tl-track__node"
          aria-hidden="true"
        />
        <span class="tl-track__n num">{{ String(index + 1).padStart(2, '0') }}</span>
        <UIcon
          :name="style.icon"
          class="tl-track__icon"
          aria-hidden="true"
        />
        <span class="tl-track__title">{{ subject.title }}</span>
        <span class="sr-only">, {{ statusText }}</span>
      </NuxtLink>

      <button
        v-if="subject.lessons.length"
        type="button"
        class="tl-track__toggle"
        :aria-expanded="open"
        :aria-label="`${open ? 'Close' : 'Open'} ${subject.title}`"
        @click="open = !open"
      >
        <UIcon
          name="i-lucide-chevron-down"
          class="size-3.5"
        />
      </button>
    </div>

    <div
      v-if="open"
      class="tl-track__body"
    >
      <div
        v-for="module in subject.modules"
        :key="module.path"
        class="tl-module"
      >
        <div class="tl-module__head">
          <NuxtLink
            :to="module.path"
            class="tl-row tl-module__link"
            :aria-current="current === module.path ? 'page' : undefined"
            :data-active="current === module.path || undefined"
            @click="$emit('navigate')"
          >
            <span
              class="tl-node tl-module__node"
              aria-hidden="true"
            />
            <span class="tl-module__title">{{ module.title }}</span>
            <span
              v-if="!shown(module.path)"
              class="tl-module__count num"
            >{{ module.lessons.length }}</span>
          </NuxtLink>

          <button
            type="button"
            class="tl-track__toggle"
            :aria-expanded="shown(module.path)"
            :aria-label="`${shown(module.path) ? 'Close' : 'Open'} ${module.title}`"
            @click="toggleModule(module.path)"
          >
            <UIcon
              name="i-lucide-chevron-down"
              class="size-3.5"
            />
          </button>
        </div>

        <ul v-if="shown(module.path)">
          <li
            v-for="lesson in module.lessons"
            :key="lesson.path"
          >
            <PlayerRailLesson
              :lesson="lesson"
              :active="lesson.path === current"
              @navigate="$emit('navigate')"
            />
          </li>
        </ul>
      </div>

      <ul v-if="!subject.modules.length && subject.lessons.length">
        <li
          v-for="lesson in subject.lessons"
          :key="lesson.path"
        >
          <PlayerRailLesson
            :lesson="lesson"
            :active="lesson.path === current"
            @navigate="$emit('navigate')"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.tl-track__head,
.tl-module__head {
  display: flex;
  align-items: stretch;
}

.tl-track__link,
.tl-module__link {
  flex: 1;
  min-width: 0;
}

.tl-track__n {
  flex: none;
  width: 1.375rem;
  font-size: 0.75rem;
  color: var(--ui-text-dimmed);
}

/* The track's mark, in its own colour, sized to the row's cap height so the
   timeline stays a quiet line of rows. */
.tl-track__icon {
  flex: none;
  width: 0.875rem;
  height: 0.875rem;
  color: var(--track);
}

.dark .tl-track__icon {
  color: color-mix(in oklab, var(--track) 68%, white);
}

.tl-track__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tl-track[data-current] > .tl-track__head .tl-track__link {
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

/* The track node: always the track's colour. Hollow, ring, filled. */
.tl-track__node {
  z-index: 1;
  width: 0.8125rem;
  height: 0.8125rem;
  border-radius: 999px;
  border: 1.5px solid var(--track);
  background: var(--ui-bg);
}

.dark .tl-track__node {
  border-color: color-mix(in oklab, var(--track) 70%, white);
}

.tl-track[data-status='doing'] .tl-track__node {
  border-width: 3.5px;
}

.tl-track[data-status='done'] .tl-track__node {
  background: var(--track);
}

.dark .tl-track[data-status='done'] .tl-track__node {
  background: color-mix(in oklab, var(--track) 70%, white);
}

.tl-track__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 2rem;
  color: var(--ui-text-dimmed);
  transition: color var(--dgm-t-fast) var(--dgm-ease);
}

.tl-track__toggle:hover {
  color: var(--ui-text-highlighted);
}

.tl-track__toggle:focus-visible {
  outline: 2px solid var(--ui-text-highlighted);
  outline-offset: -2px;
}

.tl-track__toggle .iconify {
  transition: transform var(--dgm-t-fast) var(--dgm-ease);
}

.tl-track__toggle[aria-expanded='true'] .iconify {
  transform: rotate(180deg);
}

.tl-track__body {
  padding-bottom: 0.5rem;
}

/* A chapter: a smaller hollow square on the line, its title as a label. */
.tl-module__link {
  min-height: 1.875rem;
  padding-left: calc(var(--tl-text) + 0.25rem);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.tl-module__link[aria-current='page'] {
  color: var(--ui-text-highlighted);
}

.tl-module__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tl-module__node {
  width: 0.4375rem;
  height: 0.4375rem;
  border: 1px solid var(--ui-text-dimmed);
  background: var(--ui-bg);
}

.tl-module__count {
  flex: none;
  font-size: 0.6875rem;
  letter-spacing: 0;
  color: var(--ui-text-dimmed);
}
</style>
