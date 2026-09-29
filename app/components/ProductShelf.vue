<script setup lang="ts">
/**
 * Three things from my desk, under a lesson or on the home page, with a link to
 * the whole list on /gear. Picks the items tagged for the current track first.
 */
const props = withDefaults(defineProps<{
  /** The track slug, so a Java lesson shows the Java book first. */
  track?: string
  limit?: number
  title?: string
}>(), {
  limit: 3,
  title: 'What was on my desk'
})

const { pick } = useProducts()

const items = computed(() => pick(props.track, props.limit))
</script>

<template>
  <section
    v-if="items.length"
    class="shelf"
    aria-label="Products I use"
  >
    <div class="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 class="font-display text-lg font-semibold text-highlighted">
          {{ title }}
        </h2>
        <p class="text-xs text-dimmed mt-1">
          Some links are affiliate links; buying through them supports this guide at no extra cost to you.
        </p>
      </div>
      <UButton
        to="/gear"
        label="Everything I use"
        trailing-icon="i-lucide-arrow-right"
        size="sm"
        color="neutral"
        variant="ghost"
        class="shrink-0"
      />
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProductCard
        v-for="item in items"
        :key="item.name"
        :product="item"
        compact
      />
    </div>
  </section>
</template>
