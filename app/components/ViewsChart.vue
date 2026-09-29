<script setup lang="ts">
/**
 * Page views per day as plain SVG bars. No chart library: thirty rectangles and
 * two labels. The tallest bar sets the scale; hovering a bar shows its day and
 * count, and the whole series is repeated in a visually hidden table for
 * screen readers.
 */
const props = withDefaults(defineProps<{
  points: { day: string, views: number, sessions?: number }[]
  height?: number
  label?: string
}>(), {
  height: 160,
  label: 'Page views per day'
})

const max = computed(() => Math.max(1, ...props.points.map(p => p.views)))
const width = computed(() => Math.max(1, props.points.length) * 12)
const hover = ref<number | null>(null)
const active = computed(() => (hover.value !== null ? props.points[hover.value] : props.points.at(-1)))
</script>

<template>
  <figure class="chart">
    <figcaption class="chart__head">
      <span class="text-sm text-muted">{{ label }}</span>
      <span
        v-if="active"
        class="text-sm tabular-nums"
      >
        <span class="font-semibold text-highlighted">{{ formatCount(active.views) }}</span>
        <span class="text-muted"> on {{ formatDay(active.day) }}</span>
      </span>
    </figcaption>
    <svg
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      class="chart__svg"
      :style="{ height: `${height}px` }"
      role="img"
      :aria-label="label"
      @mouseleave="hover = null"
    >
      <rect
        v-for="(p, i) in points"
        :key="p.day"
        :x="i * 12 + 1.5"
        :width="9"
        :y="height - Math.max(1, (p.views / max) * (height - 4))"
        :height="Math.max(1, (p.views / max) * (height - 4))"
        rx="1.5"
        class="chart__bar"
        :data-active="hover === i ? '' : undefined"
        @mouseenter="hover = i"
      />
    </svg>
    <div class="chart__axis">
      <span>{{ formatDay(points[0]?.day) }}</span>
      <span>{{ formatDay(points.at(-1)?.day) }}</span>
    </div>
    <table class="sr-only">
      <caption>{{ label }}</caption>
      <tr
        v-for="p in points"
        :key="p.day"
      >
        <th scope="row">
          {{ p.day }}
        </th>
        <td>{{ p.views }}</td>
      </tr>
    </table>
  </figure>
</template>

<style scoped>
.chart__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.chart__svg {
  display: block;
  width: 100%;
}

.chart__bar {
  fill: color-mix(in oklab, var(--ui-primary) 55%, transparent);
  transition: fill 120ms ease;
}

.chart__bar[data-active] {
  fill: var(--ui-primary);
}

.chart__axis {
  display: flex;
  justify-content: space-between;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--ui-text-dimmed);
}
</style>
