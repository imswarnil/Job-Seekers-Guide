<script setup lang="ts">
import type { PathCollectionItem } from '@nuxt/content'

const props = defineProps<{
  page?: PathCollectionItem
}>()

/**
 * The body, cut into the pieces the repeating ads go between. Short overviews
 * fall under the paragraph floor in `autoAds.ts` and come back in one piece,
 * which is most of them.
 */
const chunks = useAutoAds(() => props.page?.body as never)

const route = useRoute()

const { subject } = usePathPlayer(() => route.path)
const { moduleProgress } = useProgress()

/**
 * Modules start open, and stay however the reader leaves them.
 *
 * Open by default because a collapsed subject page tells somebody nothing about
 * what they are about to learn — the contents *are* the pitch. Collapsible
 * because a subject with six modules and forty lessons is otherwise a wall.
 */
const closed = ref(new Set<string>())

function toggle(modulePath: string) {
  const next = new Set(closed.value)
  if (next.has(modulePath)) {
    next.delete(modulePath)
  } else {
    next.add(modulePath)
  }
  closed.value = next
}

const allClosed = computed(() => closed.value.size === (subject.value?.modules.length || 0))

function toggleAll() {
  closed.value = allClosed.value
    ? new Set()
    : new Set(subject.value?.modules.map(module => module.path) || [])
}
</script>

<template>
  <div>
    <section
      v-if="page?.outcomes?.length"
      class="mb-14"
      aria-labelledby="outcomes"
    >
      <h2
        id="outcomes"
        class="label"
      >
        By the end you can
      </h2>
      <ol class="outcomes row-list mt-3">
        <li
          v-for="(outcome, index) in page.outcomes"
          :key="outcome"
          class="outcomes__row"
        >
          <span class="outcomes__n num">{{ String(index + 1).padStart(2, '0') }}</span>
          <span>{{ outcome }}</span>
        </li>
      </ol>
    </section>

    <div
      v-if="page?.body"
      class="guide-prose"
    >
      <template
        v-for="(chunk, index) in chunks"
        :key="index"
      >
        <ContentRenderer :value="{ ...page!, body: chunk }" />
        <AdSlot
          v-if="index < chunks.length - 1"
          placement="in-feed"
          class="ad-auto"
        />
      </template>
    </div>

    <AdSlot placement="in-article" />

    <div class="contents-head rule-strong">
      <h2 class="headline contents-head__title">
        Contents
      </h2>

      <UButton
        v-if="subject?.modules.length"
        :label="allClosed ? 'Expand all' : 'Collapse all'"
        :icon="allClosed ? 'i-lucide-chevrons-down' : 'i-lucide-chevrons-up'"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="toggleAll"
      />
    </div>

    <div class="modules">
      <section
        v-for="(module, index) in subject?.modules"
        :key="module.path"
        class="module"
      >
        <div class="module__head">
          <span class="module__number num">{{ String(index + 1).padStart(2, '0') }}</span>

          <span class="module__main">
            <NuxtLink
              :to="module.path"
              class="module__title"
            >
              {{ module.title }}
            </NuxtLink>
            <span class="module__meta num">
              {{ module.lessons.length }} {{ module.lessons.length === 1 ? 'lesson' : 'lessons' }}<template v-if="module.minutes"> · {{ formatMinutes(module.minutes) }}</template>
              <ClientOnly>
                <template v-if="moduleProgress(module).started"> · {{ moduleProgress(module).completed }} finished</template>
              </ClientOnly>
            </span>
          </span>

          <button
            type="button"
            class="module__toggle"
            :aria-expanded="!closed.has(module.path)"
            :aria-label="`${closed.has(module.path) ? 'Show' : 'Hide'} the lessons in ${module.title}`"
            @click="toggle(module.path)"
          >
            <UIcon
              name="i-lucide-chevron-down"
              class="size-4"
            />
          </button>
        </div>

        <ModuleContents
          v-if="!closed.has(module.path)"
          :lessons="module.lessons"
          class="module__lessons"
        />
      </section>

      <ModuleContents
        v-if="!subject?.modules.length && subject?.lessons.length"
        :lessons="subject.lessons"
        numbered
      />
    </div>

    <StatsInvite />
  </div>
</template>

<style scoped>
.outcomes__row {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr);
  gap: 0.5rem;
  padding-block: 0.75rem;
  color: var(--ui-text);
}

.outcomes__n {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ui-text-dimmed);
}

.contents-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 4rem;
  padding-top: 1rem;
}

.module {
  margin-top: 2.5rem;
}

.module__head {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--rule-strong);
}

.module__number {
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ui-text-dimmed);
}

.module__main {
  min-width: 0;
}

.module__title {
  display: block;
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--ui-text-highlighted);
  transition: color var(--dgm-t-fast) var(--dgm-ease);
}

.module__title:hover {
  color: var(--ui-primary);
}

.module__meta {
  display: block;
  margin-top: 0.25rem;
  font-size: var(--text-xs);
  color: var(--ui-text-dimmed);
}

.module__toggle {
  align-self: center;
  display: flex;
  padding: 0.375rem;
  color: var(--ui-text-dimmed);
}

.module__toggle:hover {
  color: var(--ui-text-highlighted);
}

.module__toggle .iconify {
  transition: transform var(--dgm-t-fast) var(--dgm-ease);
}

.module__toggle[aria-expanded='false'] .iconify {
  transform: rotate(-90deg);
}

/* The lessons hang under the chapter title, from the same column. */
.module__lessons {
  margin-left: 3rem;
  border-top: 0;
}
</style>
