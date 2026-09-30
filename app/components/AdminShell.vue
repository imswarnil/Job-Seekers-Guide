<script setup lang="ts">
/**
 * The frame for every /admin page: a header, the tab bar and the page. The
 * moderation pages (stories, comments, guestbook, users) live under Content,
 * so that tab stays lit on them.
 */
defineProps<{ title: string, description?: string }>()

const route = useRoute()
const contentPaths = ['/admin/content', '/admin/stories', '/admin/comments', '/admin/guestbook', '/admin/users']

const links = computed(() => [
  { label: 'Overview', to: '/admin', icon: 'i-lucide-layout-dashboard', exact: true },
  { label: 'Live', to: '/admin/live', icon: 'i-lucide-radio' },
  { label: 'Traffic', to: '/admin/traffic', icon: 'i-lucide-chart-line' },
  { label: 'Content', to: '/admin/content', icon: 'i-lucide-files', active: contentPaths.includes(route.path) },
  { label: 'Tables', to: '/admin/tables', icon: 'i-lucide-table' },
  { label: 'Payments', to: '/admin/payments', icon: 'i-lucide-indian-rupee' },
  { label: 'Audit', to: '/admin/audit', icon: 'i-lucide-scroll-text' }
])

const contentLinks = [
  { label: 'Summary', to: '/admin/content' },
  { label: 'Stories', to: '/admin/stories' },
  { label: 'Comments', to: '/admin/comments' },
  { label: 'Guestbook', to: '/admin/guestbook' },
  { label: 'Users', to: '/admin/users' }
]
const inContent = computed(() => contentPaths.includes(route.path))
</script>

<template>
  <div class="admin">
    <div class="border-b border-default bg-elevated/40">
      <UContainer class="max-w-[90rem] pt-6">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">
              Admin
            </p>
            <h1 class="mt-1 text-2xl font-bold text-highlighted">
              {{ title }}
            </h1>
            <p
              v-if="description"
              class="mt-1 text-sm text-muted max-w-3xl"
            >
              {{ description }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <slot name="actions" />
          </div>
        </div>

        <UNavigationMenu
          :items="links"
          highlight
          class="mt-4 -mb-px overflow-x-auto"
          aria-label="Admin sections"
        />
      </UContainer>
    </div>

    <UContainer class="max-w-[90rem] py-6 lg:py-8">
      <nav
        v-if="inContent"
        class="mb-6 flex flex-wrap gap-1"
        aria-label="Content sections"
      >
        <UButton
          v-for="l in contentLinks"
          :key="l.to"
          :to="l.to"
          size="sm"
          :color="route.path === l.to ? 'primary' : 'neutral'"
          :variant="route.path === l.to ? 'soft' : 'ghost'"
        >
          {{ l.label }}
        </UButton>
      </nav>
      <slot />
    </UContainer>
  </div>
</template>
