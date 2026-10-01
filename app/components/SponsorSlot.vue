<script setup lang="ts">
/**
 * The site sponsor, wherever the site shows them.
 *
 * There is one spot, `brand`, sold on the outbid model in
 * docs/api-contract.md: the highest single paid bid holds it, with no expiry,
 * until somebody pays more. Whoever holds it is the site sponsor, and their
 * card is drawn by `SponsorCard` from the design they made on /sponsor, in
 * one of two standard shapes:
 *
 *   `leaderboard`  a wide, slim strip across the full grid (728×90 in spirit).
 *                  Home, and the top of /stories, /guestbook and /stats (and
 *                  of /sponsor itself, when somebody holds the spot).
 *   `square`       a compact near-square card (300×250 in spirit) for a side
 *                  column. Beside every lesson, and in the left sidebar.
 *
 * Every instance is marked "Site sponsor" and the card's link carries
 * `rel="sponsored noopener"` (SponsorCard sets it). Beside the mark sits a
 * second, smaller link, "See all sponsors", to the leaderboard on /sponsor.
 * It is outside the card on purpose: the card is the sponsor's link and goes
 * to the sponsor, this one is the site's and stays on the site.
 *
 * The holder is fetched in the browser only, once for the whole page (see
 * useSponsorSlot). Until the answer is in, a strip holds its height and says
 * nothing, because "this spot is open" would be untrue for a moment on a site
 * that has a sponsor. When nobody holds the spot, the page says so in one
 * honest line that links to /sponsor. `hide-empty` is for the sidebar, where
 * an empty spot shows nothing at all.
 */
const props = withDefaults(defineProps<{
  /**
   * The slot's name, as the server knows it. There is one, `brand`, and it is
   * the default. `slot="…"` (the spelling in docs/api-contract.md) also works,
   * but ESLint's vue/no-deprecated-slot-attribute rejects it in a template.
   */
  name?: string
  slot?: string
  /** The shape: a full-width strip, or a compact card for a side column. */
  format?: 'leaderboard' | 'square'
  /** Render nothing unless somebody holds the spot. */
  hideEmpty?: boolean
}>(), {
  name: 'brand',
  slot: undefined,
  format: 'square',
  hideEmpty: false
})

const { holder, price, loaded, load } = useSponsorSlot(() => props.slot || props.name || 'brand')

onMounted(load)

/** A square that has not heard back yet takes no room; a strip keeps its place. */
const shown = computed(() => {
  if (holder.value) {
    return true
  }
  if (props.hideEmpty) {
    return false
  }
  return loaded.value || props.format === 'leaderboard'
})
</script>

<template>
  <aside
    v-if="shown"
    class="sponsor"
    :data-format="format"
    :aria-label="holder ? `Site sponsor: ${holder.name}` : 'Site sponsor spot'"
  >
    <p class="sponsor__head">
      <span class="label">Site sponsor</span>
      <NuxtLink
        v-if="holder"
        to="/sponsor#leaderboard"
        class="sponsor__all"
      >
        See all sponsors
        <UIcon
          name="i-lucide-arrow-right"
          class="size-3"
        />
      </NuxtLink>
    </p>

    <SponsorCard
      v-if="holder"
      :sponsor="holder"
      :format="format"
    />

    <div
      v-else-if="!loaded"
      class="sponsor__wait"
      aria-hidden="true"
    />

    <NuxtLink
      v-else
      to="/sponsor"
      class="sponsor__open"
    >
      <span class="sponsor__open-text">
        This spot is open: sponsor the guide<template v-if="price"> from <span class="num">{{ price }}</span></template>
      </span>
      <UIcon
        name="i-lucide-arrow-right"
        class="sponsor__open-arrow size-4"
      />
    </NuxtLink>
  </aside>
</template>

<style scoped>
.sponsor {
  min-width: 0;
}

.sponsor__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.125rem 0.75rem;
  margin-bottom: 0.375rem;
}

.sponsor[data-format='square'] .sponsor__head {
  max-width: 18.75rem;
}

/* The site's own link beside the sponsor's card: small, and quiet until
   pointed at. */
.sponsor__all {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  line-height: 1.3;
  font-weight: 500;
  color: var(--ui-text-muted);
  white-space: nowrap;
  transition: color var(--dgm-t-fast, 120ms) var(--dgm-ease, ease);
}

.sponsor__all:hover,
.sponsor__all:focus-visible {
  color: var(--ui-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* The open spot and the strip that is still loading: the same hairline box,
   the same height as a sponsor's strip, so nothing on the page moves when the
   answer arrives. */
.sponsor__wait,
.sponsor__open {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--rule-color, var(--ui-border));
  border-radius: 0;
}

.sponsor__open {
  font-size: var(--text-sm, 0.875rem);
  line-height: 1.4;
  color: var(--ui-text-muted);
  text-decoration: none;
  transition:
    border-color var(--dgm-t-fast, 120ms) var(--dgm-ease, ease),
    color var(--dgm-t-fast, 120ms) var(--dgm-ease, ease);
}

.sponsor__open:hover,
.sponsor__open:focus-visible {
  border-color: var(--ui-text-highlighted);
  color: var(--ui-text-highlighted);
}

.sponsor__open-text {
  min-width: 0;
  text-wrap: pretty;
}

.sponsor__open-arrow {
  flex-shrink: 0;
  color: var(--ui-primary);
}

.sponsor[data-format='leaderboard'] .sponsor__wait,
.sponsor[data-format='leaderboard'] .sponsor__open {
  min-height: 5.625rem;
}

.sponsor[data-format='leaderboard'] .sponsor__open {
  padding-inline: 1.25rem;
}

.sponsor[data-format='square'] .sponsor__open {
  align-items: flex-start;
  max-width: 18.75rem;
}

.sponsor[data-format='square'] .sponsor__open-arrow {
  margin-top: 0.125rem;
}
</style>
