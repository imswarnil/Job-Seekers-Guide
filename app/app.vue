<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#0a0a0a' : '#ffffff')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en-IN'
  }
})

useSeoMeta({
  titleTemplate: '%s · Bangalore Job Seekers Guide',
  twitterCard: 'summary_large_image'
})

const { navigation, files } = await useProvideContent()

/** Shared with the home page, which fills it from `/?q=` so a search engine's
 *  sitelinks search box lands on real results. */
const searchTerm = useState('search-term', () => '')

const searchLinks = [
  { label: 'Home', icon: 'i-lucide-house', to: '/' },
  { label: 'Start the guide', icon: 'i-lucide-train-front', to: '/bangalore' },
  { label: 'My story', icon: 'i-lucide-footprints', to: '/my-story' },
  { label: 'Products I use', icon: 'i-lucide-backpack', to: '/gear' }
]
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ClientOnly>
      <LazyUContentSearch
        v-model:search-term="searchTerm"
        :files="files"
        :navigation="navigation"
        :links="searchLinks"
        :fuse="{ resultLimit: 42 }"
        placeholder="Search the guide: joins, percentages, tell me about yourself…"
      />
    </ClientOnly>
  </UApp>
</template>
