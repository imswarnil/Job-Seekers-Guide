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
    <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h2 class="headline">
          {{ title }}
        </h2>
        <p class="text-xs text-dimmed mt-2">
          Some links are affiliate links; buying through them supports this guide at no extra cost to you.
        </p>
      </div>
      <NuxtLink
        to="/gear"
        class="arrow-link shrink-0"
      >
        Everything I use
        <UIcon
          name="i-lucide-arrow-right"
          class="size-4"
        />
      </NuxtLink>
    </div>

    <div class="shelf__grid">
      <ProductCard
        v-for="item in items"
        :key="item.name"
        :product="item"
        compact
      />
    </div>
  </section>
</template>

<style scoped>
.shelf__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2.5rem var(--gutter);
}

@media (min-width: 640px) {
  .shelf__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .shelf__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
