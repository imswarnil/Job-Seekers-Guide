<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()

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
      <div class="px-4 sm:px-6 lg:px-10 py-16 max-w-3xl">
        <UError
          :error="error"
          :clear="{ label: 'Back to the start', to: '/' }"
        />
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
