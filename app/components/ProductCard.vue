<script setup lang="ts">
import type { Product } from '~/composables/useProducts'

/**
 * One thing from my desk. The photo when there is one; otherwise a tile in the
 * category's colour. An empty link means Swarnil has not pasted the affiliate
 * link yet, and the button says so rather than going nowhere.
 */
const props = withDefaults(defineProps<{
  product: Product
  compact?: boolean
}>(), {
  compact: false
})

const categories: Record<string, { icon: string, color: string }> = {
  'Stationery': { icon: 'i-lucide-pen-line', color: '#d97706' },
  'Books': { icon: 'i-lucide-book-open', color: '#2563eb' },
  'Laptop & desk': { icon: 'i-lucide-laptop', color: '#0d9488' },
  'Software': { icon: 'i-lucide-code', color: '#7c3aed' }
}

const look = computed(() => categories[props.product.category] || { icon: 'i-lucide-package', color: '#f22f46' })
const link = computed(() => /^https?:\/\//i.test(props.product.url || '') ? props.product.url : '')
const failed = ref(false)
</script>

<template>
  <article
    class="product card-hover"
    :data-compact="compact || undefined"
    :style="{ '--track': look.color }"
  >
    <div class="product__media">
      <img
        v-if="product.image && !failed"
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        decoding="async"
        class="product__photo"
        @error="failed = true"
      >
      <span
        v-else
        class="product__tile"
        aria-hidden="true"
      >
        <UIcon
          :name="look.icon"
          class="size-7"
        />
      </span>

      <span
        v-if="product.badge"
        class="product__badge"
      >{{ product.badge }}</span>
    </div>

    <div class="product__body">
      <p class="product__category track-ink">
        {{ product.category }}
      </p>
      <h3 class="product__name">
        {{ product.name }}
      </h3>
      <p
        class="product__text"
        :class="compact && 'line-clamp-3'"
      >
        {{ product.description }}
      </p>

      <div class="product__foot">
        <span
          v-if="product.price"
          class="text-sm text-muted tabular-nums"
        >{{ product.price }}</span>

        <UButton
          v-if="link"
          :to="link"
          target="_blank"
          rel="sponsored noopener"
          label="See it"
          trailing-icon="i-lucide-arrow-up-right"
          size="sm"
          color="neutral"
          variant="subtle"
          class="ms-auto"
        />
        <UButton
          v-else
          label="Link coming soon"
          size="sm"
          color="neutral"
          variant="ghost"
          disabled
          class="ms-auto"
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
.product {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  border: 1px solid var(--ui-border);
  border-radius: 0;
  background: var(--ui-bg);
}

.product__media {
  position: relative;
  aspect-ratio: 16 / 9;
  background: color-mix(in oklab, var(--track) 12%, var(--ui-bg));
}

.product[data-compact] .product__media {
  aspect-ratio: 16 / 7;
}

.product__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product__tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--track);
  background:
    radial-gradient(circle at 30% 20%, color-mix(in oklab, var(--track) 22%, transparent), transparent 60%),
    repeating-linear-gradient(-45deg, transparent 0 12px, color-mix(in oklab, var(--track) 8%, transparent) 12px 13px);
}

.dark .product__tile {
  color: color-mix(in oklab, var(--track) 68%, white);
}

.product__badge {
  position: absolute;
  top: 0.625rem;
  left: 0.625rem;
  padding: 0.125rem 0.5rem;
  border-radius: 2px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.product__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1rem;
}

.product__category {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.product__name {
  margin-top: 0.25rem;
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ui-text-highlighted);
  text-wrap: balance;
}

.product__text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.product__foot {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1rem;
}
</style>
