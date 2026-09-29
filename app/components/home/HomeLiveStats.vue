<script setup lang="ts">
/**
 * The live numbers under the hero, from GET /api/stats/summary.
 *
 * Browser only, because the page is prerendered and a number baked into the
 * HTML is stale the moment it is deployed. If the request fails, or every
 * figure is zero (a fresh database, or the page opened offline), the row is
 * not drawn at all: an empty scoreboard says less than no scoreboard.
 */
interface Summary {
  visitors?: number
  liveNow?: number
  stories?: number
  jobsGot?: number
  raised?: number
}

const summary = ref<Summary | null>(null)

onMounted(async () => {
  try {
    summary.value = await $fetch<Summary>('/api/stats/summary', { timeout: 6000 })
  } catch {
    summary.value = null
  }
})

const count = new Intl.NumberFormat('en-IN')
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' })

const figures = computed(() => {
  const s = summary.value
  if (!s) {
    return []
  }
  const n = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0

  return [
    { key: 'visitors', label: 'Readers so far', value: n(s.visitors), text: count.format(n(s.visitors)), icon: 'i-lucide-users' },
    { key: 'live', label: 'Reading now', value: n(s.liveNow), text: count.format(n(s.liveNow)), icon: 'i-lucide-radio', live: true },
    { key: 'jobs', label: 'Got a job', value: n(s.jobsGot), text: count.format(n(s.jobsGot)), icon: 'i-lucide-briefcase' },
    { key: 'stories', label: 'Stories shared', value: n(s.stories), text: count.format(n(s.stories)), icon: 'i-lucide-message-square-heart' },
    // `raised` is in paise.
    { key: 'raised', label: 'Raised for the guide', value: n(s.raised), text: money.format(n(s.raised) / 100), icon: 'i-lucide-heart' }
  ]
})

const shown = computed(() => figures.value.some(figure => figure.value > 0))
</script>

<template>
  <Transition name="fade">
    <dl
      v-if="shown"
      class="live"
      aria-label="Live numbers"
    >
      <div
        v-for="figure in figures"
        :key="figure.key"
        class="live__item"
      >
        <dt class="live__label">
          <span
            v-if="figure.live"
            class="live__pulse"
          />
          <UIcon
            v-else
            :name="figure.icon"
            class="size-3.5"
          />
          {{ figure.label }}
        </dt>
        <dd class="live__value">
          {{ figure.text }}
        </dd>
      </div>
    </dl>
  </Transition>
</template>

<style scoped>
.live {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.live__item {
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-lg);
  background: color-mix(in oklab, var(--ui-bg) 70%, transparent);
  backdrop-filter: blur(6px);
}

.live__label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  color: var(--ui-text-dimmed);
}

.live__value {
  margin-top: 0.125rem;
  font-family: var(--font-pixel);
  font-size: 1.25rem;
  line-height: 1.1;
  color: var(--ui-text-highlighted);
  font-variant-numeric: tabular-nums;
}

.live__pulse {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--ui-success);
  box-shadow: 0 0 0 0 color-mix(in oklab, var(--ui-success) 60%, transparent);
  animation: pulse 1.8s var(--dgm-ease) infinite;
}

@keyframes pulse {
  70% {
    box-shadow: 0 0 0 6px transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .live__pulse {
    animation: none;
  }
}

.fade-enter-active {
  transition: opacity var(--dgm-t-base) var(--dgm-ease);
}

.fade-enter-from {
  opacity: 0;
}
</style>
