<script setup lang="ts">
/** A square dashboard panel: a title row, optional actions, the content, and loading and empty states. */
defineProps<{
  title: string
  description?: string
  loading?: boolean
  empty?: boolean
  emptyText?: string
  flush?: boolean
}>()
</script>

<template>
  <section class="admin-panel min-w-0 flex flex-col">
    <header class="flex items-start justify-between gap-3 pt-3 pb-3">
      <div class="min-w-0">
        <h2 class="label !text-highlighted">
          {{ title }}
        </h2>
        <p
          v-if="description"
          class="mt-0.5 text-xs text-muted"
        >
          {{ description }}
        </p>
      </div>
      <slot name="actions" />
    </header>
    <div :class="['flex-1 min-h-0', flush ? '' : 'pb-4']">
      <div
        v-if="loading"
        :class="['space-y-2', flush ? 'pb-4' : '']"
      >
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-5 w-full"
        />
      </div>
      <p
        v-else-if="empty"
        class="py-6 text-sm text-muted"
      >
        {{ emptyText || 'Nothing yet.' }}
      </p>
      <slot v-else />
    </div>
  </section>
</template>

<style scoped>
/* A dashboard panel is a column under a heavy rule, not a box. */
.admin-panel {
  border-top: 2px solid var(--rule-strong);
}
</style>
