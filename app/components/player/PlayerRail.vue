<script setup lang="ts">
const props = defineProps<{
  /** The lesson, chapter or track page currently open. */
  current?: string
}>()

defineEmits<{ navigate: [] }>()

const { path } = usePath()

const activeSubject = computed(() => props.current ? findSubject(path.value, props.current) : undefined)

/**
 * The guide, cut into its parts: the move, learning to code, computer science,
 * the written round, the interview, the story. Numbering runs across the whole
 * guide (`offset`), because the parts are one road, not separate courses.
 */
const sections = computed(() => byStage(path.value))

const root = useTemplateRef<HTMLElement>('root')

// Land on the lesson you are on, not at the top of the list.
onMounted(async () => {
  await nextTick()
  const active = root.value?.querySelector('[data-active]')
  active?.scrollIntoView({ block: 'center' })
})
</script>

<template>
  <nav
    ref="root"
    aria-label="The guide"
  >
    <section
      v-for="(section, sectionIndex) in sections"
      :key="section.stage"
      :class="sectionIndex && 'mt-5'"
    >
      <div class="flex items-center gap-2 px-2 mb-1.5">
        <UIcon
          :name="section.icon"
          class="size-3.5 text-dimmed shrink-0"
        />
        <h2 class="text-xs font-semibold uppercase tracking-[0.14em] text-dimmed whitespace-nowrap">
          {{ section.label }}
        </h2>
        <span class="h-px flex-1 bg-[var(--ui-border)]" />
      </div>

      <div class="space-y-0.5">
        <PlayerRailSubject
          v-for="(subject, index) in section.subjects"
          :key="subject.path"
          :subject="subject"
          :index="section.offset + index"
          :current="current"
          :expanded="subject.path === activeSubject?.path"
          @navigate="$emit('navigate')"
        />
      </div>
    </section>
  </nav>
</template>
