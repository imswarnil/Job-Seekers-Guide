<script setup lang="ts">
/** The frame for every /admin page: a title and the admin navigation. */
defineProps<{ title: string, description?: string }>()

const links = [
  { label: 'Dashboard', to: '/admin', icon: 'i-lucide-gauge', exact: true },
  { label: 'Users', to: '/admin/users', icon: 'i-lucide-users' },
  { label: 'Stories', to: '/admin/stories', icon: 'i-lucide-footprints' },
  { label: 'Comments', to: '/admin/comments', icon: 'i-lucide-message-square' },
  { label: 'Guestbook', to: '/admin/guestbook', icon: 'i-lucide-book-open-text' },
  { label: 'Money', to: '/admin/payments', icon: 'i-lucide-indian-rupee' },
  { label: 'Tables', to: '/admin/tables', icon: 'i-lucide-table' }
]
</script>

<template>
  <UContainer class="py-8 lg:py-10 max-w-7xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
          Admin
        </p>
        <h1 class="mt-1 text-2xl font-bold text-highlighted">
          {{ title }}
        </h1>
        <p
          v-if="description"
          class="mt-1 text-sm text-muted"
        >
          {{ description }}
        </p>
      </div>
      <slot name="actions" />
    </div>

    <UNavigationMenu
      :items="links"
      highlight
      class="mt-6 mb-8 border-b border-default overflow-x-auto"
    />

    <slot />
  </UContainer>
</template>
