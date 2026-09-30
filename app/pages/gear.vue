<script setup lang="ts">
/**
 * /gear: the things I used while I studied, from `content/products.yml`.
 * Some links are affiliate links, and the page says so before the first one.
 */
const { products } = useProducts()

const order = ['Stationery', 'Books', 'Laptop & desk', 'Software']

const categories = computed(() => {
  const present = new Set<string>(products.value.map(item => item.category))
  return order.filter(category => present.has(category))
})

const active = ref<string>('All')

const groups = computed(() =>
  categories.value
    .filter(category => active.value === 'All' || active.value === category)
    .map(category => ({
      category,
      items: products.value.filter(item => item.category === category)
    }))
)

usePageSeo({
  title: 'Products I use',
  description: 'The notebooks, books, desk things and software I used while I studied for the walk-ins in a PG in BTM Layout, with a line on why each one earned its place.',
  headline: 'By Swarnil'
})
</script>

<template>
  <div class="gear">
    <header class="gear__hero">
      <div class="gear__inner">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Products I use
        </p>
        <h1 class="mt-4 font-display text-3xl sm:text-4xl xl:text-5xl font-bold tracking-tight text-highlighted text-balance max-w-3xl">
          What was on my desk in the PG
        </h1>
        <p class="mt-4 text-lg text-muted max-w-3xl text-pretty">
          None of this gets you a job. A notebook you actually fill, a book you
          actually finish and a lamp that lets you study after the lights go out
          made the months easier, so here they are, with why each one earned
          its place.
        </p>

        <UAlert
          icon="i-lucide-info"
          color="neutral"
          variant="subtle"
          title="Some links are affiliate links; buying through them supports this guide at no extra cost to you."
          description="I only list what I used or would use again. Nothing here is paid placement."
          class="mt-8 max-w-3xl"
        />
      </div>
    </header>

    <div class="gear__inner py-10">
      <div
        v-if="categories.length > 1"
        class="flex flex-wrap gap-2 mb-8"
        role="group"
        aria-label="Filter by category"
      >
        <UButton
          v-for="category in ['All', ...categories]"
          :key="category"
          :label="category"
          size="sm"
          :color="active === category ? 'primary' : 'neutral'"
          :variant="active === category ? 'solid' : 'subtle'"
          :aria-pressed="active === category"
          @click="active = category"
        />
      </div>

      <div class="space-y-12">
        <section
          v-for="group in groups"
          :key="group.category"
        >
          <h2 class="font-display text-xl font-semibold text-highlighted mb-4">
            {{ group.category }}
          </h2>
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <ProductCard
              v-for="item in group.items"
              :key="item.name"
              :product="item"
            />
          </div>
        </section>
      </div>

      <p
        v-if="!products.length"
        class="text-muted"
      >
        The list is being put together.
      </p>
    </div>
  </div>
</template>

<style scoped>
.gear__inner {
  max-width: 76rem;
  margin-inline: auto;
  padding-inline: 1rem;
}

@media (min-width: 640px) {
  .gear__inner {
    padding-inline: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .gear__inner {
    padding-inline: 2.5rem;
  }
}

.gear__hero {
  padding-block: 2.5rem 3rem;
  border-bottom: 1px solid var(--ui-border);
  background:
    radial-gradient(50rem 20rem at 0% 0%, color-mix(in oklab, var(--ui-primary) 8%, transparent), transparent 70%);
}

@media (min-width: 1024px) {
  .gear__hero {
    padding-top: 4.5rem;
  }
}
</style>
