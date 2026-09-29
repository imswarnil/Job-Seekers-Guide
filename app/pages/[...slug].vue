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
           who wrote it, how to fix it, and only then anything paid. Nothing
           here scrolls inside a box except a very long contents. -->
      <div
        v-if="toc.length"
        class="shell-toc"
      >
        <UContentToc
          :links="toc"
          highlight
          class="!bg-transparent !border-0 !p-0 !static"
        />
      </div>

      <AuthorCard />

      <!-- The third-party "a human wrote this" certificate. -->
      <AuthorBadge />

      <PageActions :file="file" />

      <!-- The one block in the column that holds its place: once the reader
           has scrolled down to it, it stays in view for the rest of the page. -->
      <div class="shell-sticky">
        <SponsorSlot
          v-if="view === 'lesson'"
          name="lesson-aside"
        />

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
