<script setup lang="ts">
/**
 * The guide as a timeline: one vertical line, a node on it for every track.
 *
 *   ─ THE MOVE            a part: a small label crossing the line
 *   ●  01 Moving to …     a track, in its own colour: filled when finished,
 *   ◉  02 Java              a thick ring when in progress, hollow otherwise
 *   │  ○ STRINGS          the track you are in opens: its chapters as smaller
 *   │  · What a string…   nodes on the same line, and the lessons of the
 *   │  ✓ Immutability     chapter you are in, ticked when finished, the
 *   │  ■ Comparing …      current one marked in red
 *   ○  03 DSA
 *
 * Numbering runs across the whole guide, because the parts are one road.
 */
const props = defineProps<{
  /** The lesson, chapter or track page currently open. */
  current?: string
}>()

defineEmits<{ navigate: [] }>()

const { path } = usePath()

const activeSubject = computed(() => props.current ? findSubject(path.value, props.current) : undefined)
const sections = computed(() => byStage(path.value))

const root = useTemplateRef<HTMLElement>('root')

/** Bring the current lesson into view inside the sidebar, and only there. */
async function reveal() {
  await nextTick()
  const active = root.value?.querySelector<HTMLElement>('[data-active]')
  const scroller = active?.closest<HTMLElement>('.sidebar__scroll')
  if (!active || !scroller) {
    return
  }
  const box = active.getBoundingClientRect()
  const frame = scroller.getBoundingClientRect()
  if (box.top < frame.top || box.bottom > frame.bottom) {
    scroller.scrollTop += box.top - frame.top - frame.height / 2
  }
}

onMounted(reveal)
watch(() => props.current, reveal)
</script>

<template>
  <nav
    ref="root"
    class="tl"
    aria-label="The guide"
  >
    <NuxtLink
      to="/"
      class="tl-row tl-home"
      :aria-current="current === '/' ? 'page' : undefined"
      :data-active="current === '/' || undefined"
      @click="$emit('navigate')"
    >
      <span
        class="tl-home__node"
        aria-hidden="true"
      />
      <span>Home</span>
    </NuxtLink>

    <section
      v-for="section in sections"
      :key="section.stage"
      class="tl-part"
      :aria-label="section.label"
    >
      <h2 class="tl-part__label">
        {{ section.label }}
      </h2>

      <ol class="tl-part__tracks">
        <li
          v-for="(subject, index) in section.subjects"
          :key="subject.path"
        >
          <PlayerRailSubject
            :subject="subject"
            :index="section.offset + index"
            :current="current"
            :expanded="subject.path === activeSubject?.path"
            @navigate="$emit('navigate')"
          />
        </li>
      </ol>
    </section>
  </nav>
</template>

<style>
/* Shared by PlayerRail, RailSubject and RailLesson: one line, one geometry.
   `--tl-x` is where the line runs; every node is centred on it and every row
   starts a fixed distance to its right. */
.tl {
  --tl-x: 1.5rem;
  --tl-text: 2.625rem;
  --tl-line: var(--ui-border-accented);
  position: relative;
}

.tl::before {
  content: '';
  position: absolute;
  left: var(--tl-x);
  top: 0.75rem;
  bottom: 0;
  width: 1px;
  background: var(--tl-line);
  transform: translateX(-0.5px);
}

.tl-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2rem;
  padding: 0.3125rem 0.75rem 0.3125rem var(--tl-text);
  font-size: var(--text-sm);
  line-height: 1.3;
  color: var(--ui-text-muted);
  transition:
    color var(--dgm-t-fast) var(--dgm-ease),
    background-color var(--dgm-t-fast) var(--dgm-ease);
}

a.tl-row:hover {
  color: var(--ui-text-highlighted);
  background: var(--ui-bg-muted);
}

.tl-row:focus-visible {
  outline: 2px solid var(--ui-text-highlighted);
  outline-offset: -2px;
}

/* Any node: centred on the line. */
.tl-node,
.tl-home__node {
  position: absolute;
  left: var(--tl-x);
  top: 50%;
  transform: translate(-50%, -50%);
}

.tl-home__node {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--ui-text-highlighted);
}

.tl-home[aria-current='page'] {
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

/* A part: a small uppercase label, with a tick across the line. */
.tl-part {
  margin-top: 1.25rem;
}

.tl-part__label {
  position: relative;
  padding: 0.25rem 0.75rem 0.375rem var(--tl-text);
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.tl-part__label::before {
  content: '';
  position: absolute;
  left: calc(var(--tl-x) - 0.375rem);
  top: 50%;
  width: 0.75rem;
  height: 1px;
  background: var(--ui-text-dimmed);
}
</style>
