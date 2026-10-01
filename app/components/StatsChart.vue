<script setup lang="ts">
/**
 * A daily line chart in plain SVG, in the Swiss style: hairline grid, square
 * markers, tabular figures, no shadows, no gradients. The first series is the
 * one that matters and is drawn in the accent with a flat area under it; any
 * others are drawn in ink, thinner.
 *
 * Hover, touch or the arrow keys pick a day and a tooltip shows every series on
 * it. The same numbers sit in a table under the chart, behind "Show as a
 * table", for a screen reader or anyone who wants the figures.
 */
export interface ChartSeries {
  key: string
  label: string
  values: number[]
}

const props = withDefaults(defineProps<{
  /** ISO days, `YYYY-MM-DD`, one per point, oldest first. */
  days: string[]
  series: ChartSeries[]
  /** Names the chart for assistive technology and captions the table. */
  caption: string
  height?: number
  /** How values read: plain counts, or rupees (`inr`, values already in ₹). */
  format?: 'count' | 'inr'
}>(), {
  height: 260,
  format: 'count'
})

/**
 * The picked day, two-way: two charts over the same days can share one ref
 * and their crosshairs move together (`v-model:active` on both).
 */
const active = defineModel<number | null>('active', { default: null })

const box = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(box)
const width = computed(() => Math.max(280, Math.round(measured.value || 640)))

const PAD = { top: 16, right: 12, bottom: 28, left: 48 }
const plotW = computed(() => width.value - PAD.left - PAD.right)
const plotH = computed(() => props.height - PAD.top - PAD.bottom)

/** A round top for the y axis: 1, 2 or 5 times a power of ten, in four steps. */
const scale = computed(() => {
  const max = Math.max(0, ...props.series.flatMap(s => s.values))
  if (max <= 0) {
    return { top: 4, step: 1 }
  }
  // Counts are whole numbers: below a step of one the axis would read
  // "0.5 readers", so the step floors at one.
  if (max <= 4) {
    return { top: 4, step: 1 }
  }
  const rough = max / 4
  const power = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map(m => m * power).find(s => s >= rough) ?? 10 * power
  return { top: Math.max(step * 4, Math.ceil(max / step) * step), step }
})

const ticks = computed(() => {
  const out: number[] = []
  for (let v = 0; v <= scale.value.top + 1e-9; v += scale.value.step) {
    out.push(Math.round(v * 100) / 100)
  }
  return out
})

const n = computed(() => props.days.length)
const x = (i: number) => PAD.left + (n.value <= 1 ? plotW.value / 2 : (i / (n.value - 1)) * plotW.value)
const y = (v: number) => PAD.top + plotH.value - (v / scale.value.top) * plotH.value

function linePath(values: number[]) {
  return values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
}

function areaPath(values: number[]) {
  if (!values.length) {
    return ''
  }
  const base = y(0).toFixed(1)
  return `${linePath(values)}L${x(values.length - 1).toFixed(1)},${base}L${x(0).toFixed(1)},${base}Z`
}

const fmtPlain = new Intl.NumberFormat('en-IN')
const fmtRupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const compactPlain = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })

const fmtValue = (v: number) => (props.format === 'inr' ? fmtRupees.format(v) : fmtPlain.format(v))
const fmtAxis = (v: number) => (props.format === 'inr' ? `₹${compactPlain.format(v)}` : compactPlain.format(v))
const dayLong = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const dayShort = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' })

const asDate = (day: string) => new Date(`${day}T00:00:00Z`)

/** Five or six evenly spaced dates along the bottom. */
const xLabels = computed(() => {
  const count = n.value
  if (!count) {
    return []
  }
  const long = count > 120
  const want = width.value < 480 ? 3 : 6
  const step = Math.max(1, Math.round((count - 1) / (want - 1)))
  const out: { i: number, text: string }[] = []
  for (let i = 0; i < count; i += step) {
    out.push({ i, text: (long ? monthShort : dayShort).format(asDate(props.days[i]!)) })
  }
  if (out[out.length - 1]!.i !== count - 1 && count - 1 - out[out.length - 1]!.i > step / 2) {
    out.push({ i: count - 1, text: (long ? monthShort : dayShort).format(asDate(props.days[count - 1]!)) })
  }
  return out
})

// ---- The picked day (shared through the `active` model) ----------------------
function pick(event: PointerEvent) {
  const svg = event.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const px = ((event.clientX - rect.left) / rect.width) * width.value
  if (n.value < 1) {
    return
  }
  const i = Math.round(((px - PAD.left) / plotW.value) * (n.value - 1))
  active.value = Math.min(n.value - 1, Math.max(0, i))
}

function key(event: KeyboardEvent) {
  if (!n.value) {
    return
  }
  const last = n.value - 1
  const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, PageUp: -7, PageDown: 7 }
  if (event.key in moves) {
    event.preventDefault()
    active.value = Math.min(last, Math.max(0, (active.value ?? last) + moves[event.key]!))
  } else if (event.key === 'Home') {
    event.preventDefault()
    active.value = 0
  } else if (event.key === 'End') {
    event.preventDefault()
    active.value = last
  } else if (event.key === 'Escape') {
    active.value = null
  }
}

const tip = computed(() => {
  const i = active.value
  if (i === null || !props.days[i]) {
    return null
  }
  const left = x(i)
  return {
    i,
    left,
    flip: left > width.value * 0.62,
    day: dayLong.format(asDate(props.days[i]!)),
    rows: props.series.map(s => ({ label: s.label, value: fmtValue(s.values[i] ?? 0) }))
  }
})

const totals = computed(() => props.series.map(s => s.values.reduce((a, b) => a + b, 0)))

const summary = computed(() => {
  if (!n.value) {
    return `${props.caption}: no data yet.`
  }
  const parts = props.series.map((s, k) => `${s.label}: ${fmtValue(totals.value[k]!)} in total, peak ${fmtValue(Math.max(...s.values))}`)
  return `${props.caption}, ${dayShort.format(asDate(props.days[0]!))} to ${dayShort.format(asDate(props.days[n.value - 1]!))}. ${parts.join('. ')}. Use the left and right arrow keys to read each day.`
})
</script>

<template>
  <figure class="chart">
    <ul class="chart__legend">
      <li
        v-for="(s, k) in series"
        :key="s.key"
        :data-tone="k === 0 ? 'accent' : 'ink'"
      >
        <span
          class="chart__swatch"
          aria-hidden="true"
        />
        <span class="label">{{ s.label }}</span>
        <span class="chart__total num">{{ fmtValue(active !== null ? (s.values[active] ?? 0) : totals[k]!) }}</span>
        <span class="chart__when">{{ active !== null ? 'that day' : 'in range' }}</span>
      </li>
    </ul>

    <div
      ref="box"
      class="chart__box"
      :style="{ height: `${height}px` }"
    >
      <svg
        :viewBox="`0 0 ${width} ${height}`"
        :width="width"
        :height="height"
        role="img"
        :aria-label="summary"
        tabindex="0"
        class="chart__svg"
        @pointermove="pick"
        @pointerdown="pick"
        @pointerleave="active = null"
        @keydown="key"
        @blur="active = null"
      >
        <!-- Grid and y axis -->
        <g class="chart__grid">
          <template
            v-for="t in ticks"
            :key="t"
          >
            <line
              :x1="PAD.left"
              :x2="width - PAD.right"
              :y1="y(t)"
              :y2="y(t)"
              :data-zero="t === 0 ? '' : undefined"
            />
            <text
              :x="PAD.left - 8"
              :y="y(t)"
              text-anchor="end"
              dominant-baseline="middle"
            >{{ fmtAxis(t) }}</text>
          </template>
        </g>

        <!-- X axis labels, with a short tick above each -->
        <g class="chart__x">
          <template
            v-for="l in xLabels"
            :key="l.i"
          >
            <line
              :x1="x(l.i)"
              :x2="x(l.i)"
              :y1="y(0)"
              :y2="y(0) + 4"
            />
            <text
              :x="x(l.i)"
              :y="height - 8"
              :text-anchor="l.i === 0 ? 'start' : l.i === n - 1 ? 'end' : 'middle'"
            >{{ l.text }}</text>
          </template>
        </g>

        <!-- Series: the first in the accent, with its area; the rest in ink -->
        <template
          v-for="(s, k) in series"
          :key="s.key"
        >
          <path
            v-if="k === 0"
            :d="areaPath(s.values)"
            class="chart__area"
          />
        </template>
        <template
          v-for="(s, k) in [...series].reverse()"
          :key="`l-${s.key}`"
        >
          <path
            :d="linePath(s.values)"
            class="chart__line"
            :data-tone="k === series.length - 1 ? 'accent' : 'ink'"
          />
        </template>

        <!-- The picked day -->
        <g
          v-if="tip"
          class="chart__cursor"
        >
          <line
            :x1="tip.left"
            :x2="tip.left"
            :y1="PAD.top"
            :y2="y(0)"
          />
          <rect
            v-for="(s, k) in series"
            :key="s.key"
            :x="tip.left - 3.5"
            :y="y(s.values[tip.i] ?? 0) - 3.5"
            width="7"
            height="7"
            :data-tone="k === 0 ? 'accent' : 'ink'"
          />
        </g>
      </svg>

      <div
        v-if="tip"
        class="chart__tip"
        :style="tip.flip ? { right: `${width - tip.left + 10}px` } : { left: `${tip.left + 10}px` }"
        aria-hidden="true"
      >
        <p class="label">
          {{ tip.day }}
        </p>
        <p
          v-for="(r, k) in tip.rows"
          :key="r.label"
          class="chart__tip-row"
          :data-tone="k === 0 ? 'accent' : 'ink'"
        >
          <span class="chart__swatch" />
          <span class="flex-1">{{ r.label }}</span>
          <span class="num font-semibold">{{ r.value }}</span>
        </p>
      </div>
    </div>

    <details class="chart__table">
      <summary class="label">
        Show as a table
      </summary>
      <div class="chart__scroll">
        <table>
          <caption class="sr-only">
            {{ caption }}
          </caption>
          <thead>
            <tr>
              <th scope="col">
                Day
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
              v-for="(d, i) in [...days].reverse()"
              :key="d"
            >
              <th scope="row">
                {{ dayShort.format(asDate(d)) }} {{ d.slice(0, 4) }}
              </th>
              <td
                v-for="s in series"
                :key="s.key"
                class="num"
              >
                {{ fmtValue(s.values[days.length - 1 - i] ?? 0) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </figure>
</template>

<style scoped>
.chart {
  --tone-accent: var(--ui-primary);
  --tone-ink: var(--ui-text-highlighted);

  min-width: 0;
}

[data-tone='accent'] {
  --tone: var(--tone-accent);
}

[data-tone='ink'] {
  --tone: var(--tone-ink);
}

.chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 2rem;
  margin-bottom: 1rem;
}

.chart__legend li {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  column-gap: 0.5rem;
}

.chart__swatch {
  display: inline-block;
  width: 0.625rem;
  height: 0.625rem;
  background: var(--tone);
}

.chart__total {
  grid-column: 1 / -1;
  font-size: 1.75rem;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ui-text-highlighted);
}

.chart__when {
  grid-column: 1 / -1;
  font-size: 0.75rem;
  color: var(--ui-text-muted);
}

.chart__box {
  position: relative;
  width: 100%;
}

.chart__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  touch-action: pan-y;
  cursor: crosshair;
}

.chart__svg:focus-visible {
  outline: 2px solid var(--ui-text-highlighted);
  outline-offset: 4px;
}

.chart__grid line {
  stroke: var(--guide-color, var(--ui-border));
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.chart__grid line[data-zero] {
  stroke: var(--ui-text-highlighted);
}

.chart__grid text,
.chart__x text {
  font-size: 11px;
  fill: var(--ui-text-muted);
  font-variant-numeric: tabular-nums lining-nums;
}

.chart__x line {
  stroke: var(--ui-text-highlighted);
  shape-rendering: crispEdges;
}

.chart__area {
  fill: var(--tone-accent);
  opacity: 0.08;
}

.chart__line {
  fill: none;
  stroke: var(--tone);
  stroke-width: 1.25;
  stroke-linejoin: round;
  stroke-linecap: square;
}

.chart__line[data-tone='accent'] {
  stroke-width: 2;
}

.chart__cursor line {
  stroke: var(--ui-text-highlighted);
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.chart__cursor rect {
  fill: var(--ui-bg);
  stroke: var(--tone);
  stroke-width: 2;
}

.chart__tip {
  position: absolute;
  top: 0;
  z-index: 1;
  min-width: 11rem;
  padding: 0.5rem 0.625rem;
  background: var(--ui-bg);
  border: 1px solid var(--ui-text-highlighted);
  pointer-events: none;
}

.chart__tip-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--ui-text-highlighted);
}

.chart__table {
  margin-top: 1rem;
  border-top: 1px solid var(--rule-color, var(--ui-border));
  padding-top: 0.625rem;
}

.chart__table summary {
  cursor: pointer;
}

.chart__scroll {
  max-height: 20rem;
  margin-top: 0.75rem;
  overflow: auto;
}

.chart__table table {
  width: 100%;
  font-size: 0.8125rem;
  border-collapse: collapse;
}

.chart__table th,
.chart__table td {
  padding: 0.375rem 0.5rem 0.375rem 0;
  text-align: right;
  border-bottom: 1px solid var(--rule-color, var(--ui-border));
  font-variant-numeric: tabular-nums lining-nums;
}

.chart__table th:first-child {
  text-align: left;
  font-weight: 500;
}

.chart__table thead th {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-text-muted);
  position: sticky;
  top: 0;
  background: var(--ui-bg);
}
</style>
