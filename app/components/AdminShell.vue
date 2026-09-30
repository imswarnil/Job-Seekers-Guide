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
    <header class="admin__band guides">
      <div class="frame">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="min-w-0">
            <p class="label">
              <span class="mark" /> Admin
            </p>
            <h1 class="admin__title">
              {{ title }}
            </h1>
            <p
              v-if="description"
              class="mt-2 text-sm text-muted max-w-3xl"
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
          color="neutral"
          class="mt-5 -mb-px overflow-x-auto"
          aria-label="Admin sections"
        />
      </div>
    </header>

    <div class="admin__page guides">
      <div class="frame">
        <nav
          v-if="inContent"
          class="admin__sub"
          aria-label="Content sections"
        >
          <NuxtLink
            v-for="l in contentLinks"
            :key="l.to"
            :to="l.to"
            class="admin__sub-link"
            :aria-current="route.path === l.to ? 'page' : undefined"
          >
            {{ l.label }}
          </NuxtLink>
        </nav>
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The dashboard wants more width than reading does. */
.admin {
  --grid-max: 90rem;
}

.admin__band {
  padding-top: 2rem;
  border-bottom: 1px solid var(--rule-color);
}

.admin__title {
  margin-top: 0.75rem;
  font-size: var(--text-3xl);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.035em;
  color: var(--ui-text-highlighted);
}

.admin__page {
  padding-block: 2rem 4rem;
}

.admin__sub {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--rule-color);
}

.admin__sub-link {
  position: relative;
  padding: 0.5rem 1rem 0.625rem 0;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ui-text-muted);
}

.admin__sub-link + .admin__sub-link {
  padding-left: 1rem;
}

.admin__sub-link:hover,
.admin__sub-link[aria-current='page'] {
  color: var(--ui-text-highlighted);
}

.admin__sub-link[aria-current='page']::after {
  content: '';
  position: absolute;
  right: 1rem;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--ui-primary);
}

.admin__sub-link + .admin__sub-link[aria-current='page']::after {
  left: 1rem;
}
</style>
