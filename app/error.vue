<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const notFound = computed(() => props.error.statusCode === 404)
const { open: openSearch } = useContentSearch()

useHead({
  htmlAttrs: {
    lang: 'en-IN'
  }
})

useSeoMeta({
  title: 'Page not found',
  description: 'This page is not in the guide. Search for what you were looking for, or start from the beginning.'
})

const { navigation, files } = await useProvideContent()
</script>

<template>
  <UApp>
    <NuxtLayout>
      <div class="error guides">
        <div class="frame swiss-grid">
          <div class="error__body">
            <p class="error__code num">
              {{ error.statusCode || 500 }}
            </p>
            <h1 class="headline mt-6">
              {{ notFound ? 'This page is not in the guide.' : 'Something went wrong on my side.' }}
            </h1>
            <p class="lede mt-4">
              {{ notFound
                ? 'It may have moved when the guide was reordered. Search for what you were looking for, or start from the beginning.'
                : 'Try again in a moment. If it keeps happening, the report link on any lesson reaches me.' }}
            </p>
            <div class="mt-8 flex flex-wrap items-center gap-3">
              <UButton
                label="Back to the start"
                size="lg"
                @click="clearError({ redirect: '/' })"
              />
              <UButton
                label="Search the guide"
                icon="i-lucide-search"
                color="neutral"
                variant="outline"
                size="lg"
                @click="openSearch = true"
              />
            </div>
          </div>
        </div>
      </div>
    </NuxtLayout>

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>

<style scoped>
.error {
  min-height: 100%;
  padding-block: 4rem;
}

.error__body {
  grid-column: 1 / -1;
}

/* The status code, set as large as the page allows: the one thing on it. */
.error__code {
  font-size: clamp(6rem, 3rem + 16vw, 14rem);
  line-height: 0.8;
  font-weight: 700;
  letter-spacing: -0.07em;
  color: var(--ui-text-highlighted);
}

@media (min-width: 1024px) {
  .error {
    padding-block: 6rem;
  }

  .error__body {
    grid-column: 1 / span 8;
  }
}
</style>
