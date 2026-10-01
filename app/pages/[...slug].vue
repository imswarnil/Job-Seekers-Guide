<script setup lang="ts">
/**
 * Every page of the guide: a track (`/java`), a chapter (`/java/collections`)
 * or a lesson (`/java/collections/hashmap`). Depth decides which.
 */
const route = useRoute()

const depth = computed(() => route.path.split('/').filter(Boolean).length)

const { data: page } = await useAsyncData(
  () => `path:${route.path}`,
  () => queryCollection('path').path(route.path).first(),
  { watch: [() => route.path] }
)

const { path, subject, module, lesson, previous, next, position, crossesSubject } = usePathPlayer(() => route.path)

// A module folder need not carry an `index.md`. When it does not, the page is
// still real — it is built from the navigation tree. Only 404 when the content
// query and the tree both come up empty.
const known = computed(() => {
  if (page.value) {
    return true
  }
  if (depth.value === 2) {
    return Boolean(module.value && module.value.path === route.path)
  }
  return false
})

if (!page.value && !known.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const view = computed(() => depth.value >= 3 ? 'lesson' : depth.value === 2 ? 'module' : 'subject')

const title = computed(() =>
  page.value?.seo?.title || page.value?.title || module.value?.title || subject.value?.title || 'The guide'
)
const description = computed(() =>
  page.value?.seo?.description || page.value?.description || module.value?.description || subject.value?.description
)

const toc = computed(() => page.value?.body?.toc?.links || [])

/** The markdown file behind this page, for "edit this page". */
const file = computed(() => {
  const stem = page.value?.stem
  return stem ? `content/1.path/${stem}${page.value?.extension ? `.${page.value.extension}` : '.md'}` : undefined
})

usePageSeo({
  title,
  description,
  headline: computed(() => view.value === 'subject' ? 'Subject' : subject.value?.title),
  schema: computed(() => ({
    kind: view.value,
    page: page.value,
    path: path.value,
    subject: subject.value,
    module: module.value
  }))
})
</script>

<template>
  <PlayerShell>
    <template #hero>
      <LessonHeader
        v-if="view === 'lesson' && page"
        :title="page.title"
        :description="page.description"
        :lesson="lesson"
        :minutes="page.minutes"
        :kind="page.kind"
      />
      <ModuleHeader
        v-else-if="view === 'module'"
        :page="page || undefined"
      />
      <SubjectHeader
        v-else
        :page="page || undefined"
      />
    </template>

    <!-- Below xl the column beside the lesson is gone, so the contents
         moves above the prose as one collapsible line. -->
    <TocCompact
      v-if="view === 'lesson' && toc.length"
      :links="toc"
      class="xl:hidden"
    />

    <LessonPlayer
      v-if="view === 'lesson' && page"
      :page="page"
    />
    <ModuleOverview
      v-else-if="view === 'module'"
      :page="page || undefined"
    />
    <SubjectOverview
      v-else
      :page="page || undefined"
    />

    <!-- Questions and notes from readers (server builder's insertion). Loaded
         in the browser only, so the lesson itself stays fully prerendered. -->
    <ClientOnly v-if="view === 'lesson' && page">
      <LessonComments :path="route.path" />
    </ClientOnly>

    <template #aside>
      <!-- The order is the order of importance: where you are in this page,
           who wrote it, how to fix it, and only then anything paid. Each
           direct child is a `.shell-stick`: as the pane scrolls, they pin one
           after another under the one before (PlayerShell measures them and
           staggers the offsets), so nothing here ever scrolls inside a box. -->
      <div
        v-if="toc.length"
        class="shell-stick shell-toc"
      >
        <UContentToc
          :links="toc"
          highlight
          highlight-color="neutral"
          color="neutral"
          class="!bg-transparent !backdrop-blur-none !border-0 !p-0 !static"
        />
      </div>

      <div class="shell-stick">
        <AuthorCard />
      </div>

      <div class="shell-stick">
        <PageActions :file="file" />
      </div>

      <!-- Last to arrive, last to pin: the site's single sponsor spot, and the
           one sidebar ad unit (off in app.config.ts; it renders nothing until
           that boolean flips). Nothing else paid lives in this column. -->
      <div
        v-if="view === 'lesson'"
        class="shell-stick shell-stick--paid"
      >
        <SponsorSlot name="brand" />
        <AdSlot
          placement="sidebar"
          variant="card"
        />
      </div>
    </template>

    <template
      v-if="view === 'lesson'"
      #pagination
    >
      <PlayerPagination
        :previous="previous"
        :next="next"
        :crosses-subject="crossesSubject"
        :position="position"
      />
    </template>
  </PlayerShell>
</template>
