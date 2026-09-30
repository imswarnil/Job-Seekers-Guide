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
    <header class="gear__hero guides">
      <div class="frame swiss-grid">
        <div class="gear__head">
          <p class="label">
            <span class="mark" /> Products I use
          </p>
          <h1 class="display mt-5">
            What was on my desk in the PG
          </h1>
          <p class="lede mt-5">
            None of this gets you a job. A notebook you actually fill, a book you
            actually finish and a lamp that lets you study after the lights go out
            made the months easier, so here they are, with why each one earned
            its place.
          </p>
          <p class="gear__note">
            Some links are affiliate links; buying through them supports this
            guide at no extra cost to you. I only list what I used or would use
            again. Nothing here is paid placement.
          </p>
        </div>
      </div>
    </header>

    <div class="gear__body guides">
      <div class="frame">
        <div
          v-if="categories.length > 1"
          class="gear__filter"
          role="group"
          aria-label="Filter by category"
        >
          <button
            v-for="category in ['All', ...categories]"
            :key="category"
            type="button"
            class="gear__chip"
            :aria-pressed="active === category"
            @click="active = category"
          >
            {{ category }}
          </button>
        </div>

        <section
          v-for="group in groups"
          :key="group.category"
          class="gear__group swiss-grid"
        >
          <h2 class="gear__group-title">
            {{ group.category }}
            <span class="num text-dimmed">{{ String(group.items.length).padStart(2, '0') }}</span>
          </h2>
          <div class="gear__grid">
            <ProductCard
              v-for="item in group.items"
              :key="item.name"
              :product="item"
            />
          </div>
        </section>

        <p
          v-if="!products.length"
          class="text-muted"
        >
          The list is being put together.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gear__hero {
  padding-block: 2.5rem 2rem;
  border-bottom: 1px solid var(--rule-color);
}

.gear__head {
  grid-column: 1 / -1;
}

.gear__note {
  margin-top: 2rem;
  max-width: 40rem;
  padding-left: 0.875rem;
  border-left: 2px solid var(--ui-text-highlighted);
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
}

.gear__body {
  padding-block: 2.5rem 5rem;
}

.gear__filter {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--rule-color);
}

.gear__chip {
  position: relative;
  padding: 0.625rem 1rem 0.75rem 0;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ui-text-muted);
}

.gear__chip + .gear__chip {
  padding-left: 1rem;
}

.gear__chip:hover {
  color: var(--ui-text-highlighted);
}

.gear__chip[aria-pressed='true'] {
  color: var(--ui-text-highlighted);
}

.gear__chip[aria-pressed='true']::after {
  content: '';
  position: absolute;
  left: 0;
  right: 1rem;
  bottom: -1px;
  height: 2px;
  background: var(--ui-primary);
}

.gear__chip + .gear__chip[aria-pressed='true']::after {
  left: 1rem;
}

.gear__group {
  margin-top: 3.5rem;
}

.gear__group-title,
.gear__grid {
  grid-column: 1 / -1;
}

.gear__group-title {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--ui-text-highlighted);
}

.gear__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2.5rem var(--gutter);
  margin-top: 1.5rem;
}

@media (min-width: 640px) {
  .gear__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .gear__hero {
    padding-block: 4rem 2.5rem;
  }

  .gear__head {
    grid-column: 1 / span 9;
  }

  .gear__group-title {
    grid-column: 1 / span 3;
  }

  .gear__grid {
    grid-column: 4 / -1;
    margin-top: 0;
  }
}

@media (min-width: 1280px) {
  .gear__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
