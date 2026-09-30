<script setup lang="ts">
/**
 * A sponsor spot, sold on the outbid model in docs/api-contract.md: the highest
 * total paid for a slot holds it, with no expiry, until somebody pays more.
 *
 * The site sells exactly one spot, `brand`, shown in two places: a band on the
 * home page and the sticky card beside every lesson.
 *
 * Fetched in the browser only. Every page is prerendered, and a holder baked
 * into the HTML would stay there after they were outbid. While it loads, and
 * whenever the request fails, the placeholder shows; a failed request just
 * loses the price, never the invitation.
 */
const props = withDefaults(defineProps<{
  /**
   * The slot's name, as the server knows it. There is one, `brand`, and it is
   * the default. `slot="…"` (the spelling in docs/api-contract.md) also works,
   * but ESLint's vue/no-deprecated-slot-attribute rejects it in a template.
   */
  name?: string
  slot?: string
  /** `card` for a column, `banner` for a full-width band, `compact` for the sidebar. */
  variant?: 'card' | 'banner' | 'compact'
}>(), {
  name: 'brand',
  slot: undefined,
  variant: 'card'
})

interface Holder {
  name: string
  url: string
  image?: string | null
  tagline?: string | null
  amount?: number
}

interface SlotResponse {
  slot: string
  holder: Holder | null
  minimumNextBid?: number
}

const slotName = computed(() => props.slot || props.name || 'brand')

const data = ref<SlotResponse | null>(null)

onMounted(async () => {
  if (!slotName.value) {
    return
  }
  try {
    data.value = await $fetch<SlotResponse>(`/api/sponsors/slot/${encodeURIComponent(slotName.value)}`, {
      timeout: 6000
    })
  } catch {
    data.value = null
  }
})

/** Only a plain web link is ever rendered, whatever a bidder typed in. */
const isWeb = (value?: string | null) => Boolean(value && /^https?:\/\//i.test(value))

const holder = computed(() => {
  const h = data.value?.holder
  if (!h || !h.name || !isWeb(h.url)) {
    return null
  }
  return { ...h, image: isWeb(h.image) ? h.image : null }
})

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

/** Money arrives in paise. */
const price = computed(() => {
  const paise = data.value?.minimumNextBid
  return typeof paise === 'number' && paise > 0 ? inr.format(paise / 100) : undefined
})

const bidLink = '/sponsor'
const failedImage = ref(false)
</script>

<template>
  <aside
    class="sponsor"
    :data-variant="variant"
    :aria-label="holder ? `Sponsored by ${holder.name}` : 'Sponsor spot'"
  >
    <a
      v-if="holder"
      :href="holder.url"
      target="_blank"
      rel="sponsored noopener"
      class="sponsor__card card-hover"
    >
      <img
        v-if="holder.image && !failedImage"
        :src="holder.image"
        :alt="holder.name"
        loading="lazy"
        decoding="async"
        class="sponsor__image"
        @error="failedImage = true"
      >
      <span
        v-else
        class="sponsor__initial"
      >{{ holder.name.slice(0, 1).toUpperCase() }}</span>

      <span class="min-w-0 flex-1">
        <span class="sponsor__label">Sponsored</span>
        <span class="sponsor__name">{{ holder.name }}</span>
        <span
          v-if="holder.tagline && variant !== 'compact'"
          class="sponsor__tagline"
        >{{ holder.tagline }}</span>
      </span>

      <UIcon
        name="i-lucide-arrow-up-right"
        class="size-4 shrink-0 text-dimmed"
      />
    </a>

    <NuxtLink
      v-else
      :to="bidLink"
      class="sponsor__empty card-hover"
    >
      <UIcon
        name="i-lucide-megaphone"
        class="sponsor__icon"
      />
      <span class="min-w-0 flex-1">
        <span class="sponsor__label">Sponsor spot</span>
        <span class="sponsor__name">Your ad here</span>
        <span
          v-if="variant !== 'compact'"
          class="sponsor__tagline"
        >
          Outbid the current holder and keep this spot forever.<template v-if="price"> From {{ price }}.</template>
        </span>
        <span
          v-else-if="price"
          class="sponsor__tagline"
        >From {{ price }}</span>
      </span>
      <UIcon
        name="i-lucide-arrow-right"
        class="size-4 shrink-0 text-dimmed"
      />
    </NuxtLink>
  </aside>
</template>

<style scoped>
.sponsor__card,
.sponsor__empty {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  border-radius: 0;
}

.sponsor__card {
  border: 1px solid var(--ui-border);
  background: var(--ui-bg);
}

.sponsor__empty {
  border: 1px dashed var(--ui-border-accented);
  background:
    repeating-linear-gradient(
      -45deg,
      transparent 0 10px,
      color-mix(in oklab, var(--ui-border) 35%, transparent) 10px 11px
    );
}

.sponsor__image,
.sponsor__initial {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0;
  object-fit: cover;
}

.sponsor__initial {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-bg-accented);
  font-weight: 700;
  color: var(--ui-text-highlighted);
}

.sponsor__icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--ui-primary);
}

.sponsor__label {
  display: block;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.sponsor__name {
  display: block;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sponsor__tagline {
  display: block;
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.sponsor[data-variant='banner'] .sponsor__card,
.sponsor[data-variant='banner'] .sponsor__empty {
  padding: 1.125rem 1.5rem;
}

.sponsor[data-variant='compact'] .sponsor__card,
.sponsor[data-variant='compact'] .sponsor__empty {
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
}

.sponsor[data-variant='compact'] .sponsor__image,
.sponsor[data-variant='compact'] .sponsor__initial {
  width: 2rem;
  height: 2rem;
}

.sponsor[data-variant='compact'] .sponsor__icon {
  width: 1rem;
  height: 1rem;
}

.sponsor[data-variant='compact'] .sponsor__name {
  font-size: 0.8125rem;
}

.sponsor[data-variant='compact'] .sponsor__tagline {
  font-size: 0.75rem;
}
</style>
