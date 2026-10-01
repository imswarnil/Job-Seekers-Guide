<script setup lang="ts">
/**
 * The pre-footer band: the guide's numbers, and the two ways to be part of
 * them. One line of figures, three links, no box. Dropped at the end of track
 * and chapter pages here; other pages place the same component, so it takes
 * no props and reads everything itself.
 *
 * Fetched in the browser (both endpoints are edge-cached for a minute).
 * Zeros are rendered as zeros: a guide that says "0 readers this month" on
 * day one is telling the truth, and the truth is the whole pitch of /stats.
 */
const readers = ref(0)
const raised = ref(0)

onMounted(async () => {
  try {
    const [trend, summary] = await Promise.all([
      $fetch<{ totals: { visitors: number } }>('/api/stats/trend?days=30', { timeout: 6000 }),
      $fetch<{ raised: number }>('/api/stats/summary', { timeout: 6000 })
    ])
    readers.value = trend.totals.visitors
    raised.value = summary.raised
  } catch {
    // The band still stands: the links are the point, the numbers are colour.
  }
})

const count = new Intl.NumberFormat('en-IN')
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
</script>

<template>
  <aside
    class="invite"
    aria-label="The numbers behind this guide"
  >
    <p class="invite__line">
      <span class="invite__figure num">{{ count.format(readers) }}</span> readers this month ·
      <span class="invite__figure num">{{ money.format(raised / 100) }}</span> raised ·
      live on <NuxtLink
        to="/stats"
        class="invite__inline"
      >/stats</NuxtLink>
    </p>

    <div class="invite__links">
      <NuxtLink
        to="/stats"
        class="arrow-link"
      >
        See the live numbers
        <UIcon
          name="i-lucide-arrow-right"
          class="size-4"
        />
      </NuxtLink>
      <NuxtLink
        to="/sponsor"
        class="arrow-link"
      >
        Become a sponsor
        <UIcon
          name="i-lucide-arrow-right"
          class="size-4"
        />
      </NuxtLink>
      <NuxtLink
        to="/support"
        class="invite__quiet"
      >
        Support
      </NuxtLink>
    </div>
  </aside>
</template>

<style scoped>
.invite {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem 2rem;
  margin-top: 4rem;
  padding-top: 1rem;
  border-top: 2px solid var(--rule-strong);
}

.invite__line {
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
}

.invite__figure {
  font-weight: 700;
  color: var(--ui-text-highlighted);
}

.invite__inline {
  color: var(--ui-text-highlighted);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.invite__inline:hover {
  color: var(--ui-primary);
}

.invite__links {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 1.5rem;
}

.invite__quiet {
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
}

.invite__quiet:hover {
  color: var(--ui-text-highlighted);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
