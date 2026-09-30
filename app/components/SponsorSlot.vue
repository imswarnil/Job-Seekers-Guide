<script setup lang="ts">
import type { SponsorCardData, SponsorCardDesign } from '~/components/SponsorCard.vue'

/**
 * A sponsor spot, sold on the outbid model in docs/api-contract.md: the highest
 * single paid bid holds it, with no expiry, until somebody pays more.
 *
 * The site sells exactly one spot, `brand`, shown in two places: a band on the
 * home page and the sticky card beside every lesson. The holder is drawn by
 * `SponsorCard`, in the card they designed on /sponsor (the server resolves
 * the design, and gives a bid from before designs existed the default card).
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
  design?: SponsorCardDesign
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

/** Only a plain web link is ever a destination, whatever a bidder typed in. */
const isWeb = (value?: string | null) => Boolean(value && /^https?:\/\//i.test(value))

const DEFAULT_DESIGN: SponsorCardDesign = { layout: 'logo-left', accent: '#111111', ink: '#FFFFFF', cta: null }

const holder = computed<SponsorCardData | null>(() => {
  const h = data.value?.holder
  if (!h || !h.name || !isWeb(h.url)) {
    return null
  }
  return { name: h.name, url: h.url, image: h.image ?? null, tagline: h.tagline ?? null, design: h.design ?? DEFAULT_DESIGN }
})

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

/** Money arrives in paise. */
const price = computed(() => {
  const paise = data.value?.minimumNextBid
  return typeof paise === 'number' && paise > 0 ? inr.format(paise / 100) : undefined
})
</script>

<template>
  <aside
    class="sponsor"
    :data-variant="variant"
    :aria-label="holder ? `Sponsored by ${holder.name}` : 'Sponsor spot'"
  >
    <SponsorCard
      v-if="holder"
      :sponsor="holder"
      :size="variant === 'banner' ? 'band' : 'column'"
    />

    <NuxtLink
      v-else
      to="/sponsor"
      class="sponsor__empty"
    >
      <span class="sponsor__label">Sponsor spot</span>
      <span class="sponsor__name">Your ad here</span>
      <span
        v-if="variant !== 'compact'"
        class="sponsor__text"
      >
        Design your card, outbid the holder and keep this spot for as long as nobody pays more.
      </span>
      <span class="sponsor__foot">
        <span
          v-if="price"
          class="sponsor__price"
        >From {{ price }}</span>
        <span class="sponsor__go">
          Sponsor
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </span>
      </span>
    </NuxtLink>
  </aside>
</template>

<style scoped>
.sponsor__empty {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  border: 1px solid var(--rule-color, var(--ui-border));
  border-top: 3px solid var(--ui-text-highlighted);
  border-radius: 0;
  text-decoration: none;
  transition: border-color var(--dgm-t-fast, 120ms) var(--dgm-ease, ease);
}

.sponsor__empty:hover,
.sponsor__empty:focus-visible {
  border-color: var(--ui-text-highlighted);
}

.sponsor__label {
  font-size: 0.6875rem;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-text-muted);
}

.sponsor__name {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
}

.sponsor__text {
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.sponsor__foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--rule-color, var(--ui-border));
}

.sponsor__price {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums lining-nums;
  color: var(--ui-text-muted);
}

.sponsor__go {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-left: auto;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ui-primary);
}

.sponsor[data-variant='banner'] .sponsor__empty {
  padding: 1.25rem 1.5rem;
}

.sponsor[data-variant='banner'] .sponsor__name {
  font-size: 1.5rem;
}

.sponsor[data-variant='compact'] .sponsor__empty {
  padding: 0.625rem 0.75rem;
}

.sponsor[data-variant='compact'] .sponsor__name {
  font-size: 0.9375rem;
}
</style>
