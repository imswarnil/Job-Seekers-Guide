<script setup lang="ts">
/**
 * A time series as plain SVG: one area-and-line for the first series, plain
 * lines for the rest, all on ONE y-axis (so only put series of the same kind
 * together: views and visitors, not views and rupees). A crosshair and a
 * tooltip follow the pointer; the legend names every series so colour is never
 * the only cue; and the numbers are repeated in a visually hidden table.
 */
/** Any row with a time `t`; series are read from it by key. */
type Point = { t: string }

const props = withDefaults(defineProps<{
  points: Point[]
  series: { key: string, label: string }[]
  unit: 'hour' | 'day' | 'minute'
  height?: number
  label: string
  format?: (value: number) => string
}>(), {
  height: 220,
  format: (value: number) => formatCount(value)
})

// Fixed order, never cycled: the site's accent, then its second colour, then ink.
const COLORS = ['var(--ui-primary)', 'var(--ui-secondary)', 'var(--ui-text-muted)']

const W = 1000
const n = computed(() => props.points.length)
const value = (p: Point | undefined, key: string) => Number((p as Record<string, unknown> | undefined)?.[key] ?? 0)

/** A round axis maximum a little above the data. */
const max = computed(() => {
  const top = Math.max(0, ...props.points.flatMap(p => props.series.map(s => value(p, s.key))))
  if (top <= 4) {
    return 4
  }
  const step = 10 ** Math.floor(Math.log10(top))
  const nice = [1, 2, 2.5, 5, 10].map(m => m * step).find(v => v >= top) ?? top
  return nice
})

const x = (i: number) => (n.value <= 1 ? W / 2 : (i / (n.value - 1)) * W)
const y = (v: number) => props.height - (v / max.value) * (props.height - 8) - 1

function line(key: string) {
  return props.points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(value(p, key)).toFixed(1)}`).join(' ')
}
function area(key: string) {
  if (!n.value) {
    return ''
  }
  return `${line(key)} L${x(n.value - 1).toFixed(1)},${props.height} L${x(0).toFixed(1)},${props.height} Z`
}

const ticks = computed(() => [max.value, max.value / 2, 0])

const hover = ref<number | null>(null)
const svg = ref<SVGSVGElement>()
function onMove(event: PointerEvent) {
  const rect = svg.value?.getBoundingClientRect()
  if (!rect || !n.value) {
    return
  }
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  hover.value = n.value <= 1 ? 0 : Math.round(ratio * (n.value - 1))
}
const active = computed(() => (hover.value === null ? null : props.points[hover.value]))
const tipLeft = computed(() => (hover.value === null ? 0 : (x(hover.value) / W) * 100))

/** Five evenly spaced axis labels, never crowded. */
const axis = computed(() => {
  if (!n.value) {
    return []
  }
  const count = Math.min(5, n.value)
  return Array.from({ length: count }, (_, k) => {
    const i = count === 1 ? 0 : Math.round((k / (count - 1)) * (n.value - 1))
    return { i, left: (x(i) / W) * 100, text: bucketLabel(props.points[i]!.t, props.unit) }
  })
})
</script>

<template>
  <figure class="trend">
    <figcaption class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <span class="sr-only">{{ label }}</span>
      <ul class="flex flex-wrap gap-4 text-xs text-muted">
        <li
          v-for="(s, k) in series"
          :key="s.key"
          class="flex items-center gap-1.5"
        >
          <span
            class="inline-block w-4 h-0.5"
            :style="{ background: COLORS[k] }"
            aria-hidden="true"
          />
          {{ s.label }}
        </li>
      </ul>
    </figcaption>

    <div class="flex gap-2">
      <div
        class="flex flex-col justify-between text-[11px] tabular-nums text-dimmed text-right w-10 shrink-0"
        :style="{ height: `${height}px` }"
        aria-hidden="true"
      >
        <span
          v-for="t in ticks"
          :key="t"
          class="leading-none"
        >{{ formatCompact(t) }}</span>
      </div>

      <div class="relative flex-1 min-w-0">
        <svg
          ref="svg"
          :viewBox="`0 0 ${W} ${height}`"
          preserveAspectRatio="none"
          class="block w-full touch-none"
          :style="{ height: `${height}px` }"
          role="img"
          :aria-label="label"
          @pointermove="onMove"
          @pointerleave="hover = null"
        >
          <line
            v-for="t in ticks"
            :key="t"
            x1="0"
            :x2="W"
            :y1="y(t)"
            :y2="y(t)"
            class="trend__grid"
            vector-effect="non-scaling-stroke"
          />
          <path
            v-if="series[0]"
            :d="area(series[0].key)"
            class="trend__area"
          />
          <path
            v-for="(s, k) in series"
            :key="s.key"
            :d="line(s.key)"
            fill="none"
            :stroke="COLORS[k]"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
          <line
            v-if="hover !== null"
            :x1="x(hover)"
            :x2="x(hover)"
            y1="0"
            :y2="height"
            class="trend__cross"
            vector-effect="non-scaling-stroke"
          />
        </svg>

        <template v-if="active">
          <span
            v-for="(s, k) in series"
            :key="s.key"
            class="trend__dot"
            :style="{ left: `${tipLeft}%`, top: `${y(value(active, s.key))}px`, background: COLORS[k] }"
            aria-hidden="true"
          />
          <div
            class="trend__tip"
            :style="{ left: `${tipLeft}%`, transform: `translateX(${tipLeft > 70 ? '-100%' : tipLeft < 30 ? '0' : '-50%'})` }"
          >
            <p class="font-medium text-highlighted">
              {{ bucketLabel(active.t, unit, true) }}
            </p>
            <p
              v-for="s in series"
              :key="s.key"
              class="flex justify-between gap-4 tabular-nums"
            >
              <span class="text-muted">{{ s.label }}</span>
              <span class="font-semibold text-highlighted">{{ format(value(active, s.key)) }}</span>
            </p>
          </div>
        </template>

        <div
          class="relative h-5 mt-1 text-[11px] text-dimmed"
          aria-hidden="true"
        >
          <span
            v-for="(a, k) in axis"
            :key="a.i"
            class="absolute whitespace-nowrap"
            :style="{ left: `${a.left}%`, transform: k === 0 ? 'none' : k === axis.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)' }"
          >{{ a.text }}</span>
        </div>
      </div>
    </div>

    <table class="sr-only">
      <caption>{{ label }}</caption>
      <thead>
        <tr>
          <th scope="col">
            Time
          </th>
          <th
            v-for="s in series"
            :key="s.key"
            scope="col"
          >
            {{ s.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="p in points"
          :key="p.t"
        >
          <th scope="row">
            {{ bucketLabel(p.t, unit, true) }}
          </th>
          <td
            v-for="s in series"
            :key="s.key"
          >
            {{ format(value(p, s.key)) }}
          </td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>

<style scoped>
.trend__grid {
  stroke: var(--ui-border);
  stroke-width: 1;
}

.trend__area {
  fill: color-mix(in oklab, var(--ui-primary) 14%, transparent);
}

.trend__cross {
  stroke: var(--ui-border-accented);
  stroke-width: 1;
}

.trend__dot {
  position: absolute;
  width: 9px;
  height: 9px;
  margin: -4.5px 0 0 -4.5px;
  border-radius: 9999px;
  box-shadow: 0 0 0 2px var(--ui-bg);
  pointer-events: none;
}

.trend__tip {
  position: absolute;
  top: 0;
  z-index: 1;
  min-width: 9rem;
  padding: 0.5rem 0.625rem;
  font-size: 0.75rem;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border-accented);
  box-shadow: var(--shadow-md);
  pointer-events: none;
}
</style>
