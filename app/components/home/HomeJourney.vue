<script setup lang="ts">
import { trackStyle } from '~/utils/tech'
import { paneEl } from '~/utils/pane'

/**
 * My journey, as the footpath I walked. A winding road snakes down the
 * section, with each stop at a bend, alternating sides. As you scroll, a
 * walker travels the road: the part behind it is drawn solid in the accent,
 * the part ahead stays a faint dashed line, each stop lights up as the walker
 * reaches it, and the walker takes the colour of the phase it is in.
 *
 * Every `story` URL is a real file under content/1.path/16.my-story/, with the
 * numeric prefixes dropped. Rename a chapter and this list has to follow.
 *
 * How it is built
 *   · The stops are ordinary HTML, laid out by CSS (a column beside the road
 *     on a phone, alternating either side of it on a wide screen). Each has a
 *     square node, placed where the road should pass.
 *   · Once mounted, the script measures the nodes and draws one smooth SVG
 *     path through them, top to bottom. Nothing is hard-coded to a height, so
 *     it redraws itself whenever the section changes size.
 *   · Scrolling the content pane (not the window: the app is a fixed
 *     viewport) moves the walker to the point on the road level with the
 *     middle of the pane, found on the path with getPointAtLength.
 *   · Without JavaScript, or before it runs, a plain hairline stands in for
 *     the road, and every stop is there. With reduced motion, the whole road
 *     is drawn, every stop is lit, and there is no walker.
 */

type Phase = 'before' | 'move' | 'learning' | 'walkins' | 'first-job' | 'accenture' | 'switch' | 'europe'

/** The phases of the story, each in the colour of the track it belongs to. */
const phases: Record<Phase, { label: string, track: string }> = {
  'before': { label: 'Before Bangalore', track: 'operating-systems' },
  'move': { label: 'The move', track: 'bangalore' },
  'learning': { label: 'Learning', track: 'java' },
  'walkins': { label: 'The walk-ins', track: 'quantitative-aptitude' },
  'first-job': { label: 'First job', track: 'interview' },
  'accenture': { label: 'Accenture', track: 'oops' },
  'switch': { label: 'The switch', track: 'logical-reasoning' },
  'europe': { label: 'Europe', track: 'my-story' }
}

interface Stop {
  year: string
  place: string
  text: string
  phase: Phase
  story: string
  guide?: { to: string, label: string }
  turn?: boolean
  /** A short remark in Swarnil's hand, beside the road. Decorative (it
   *  restates what the card already says), so it is aria-hidden, and it only
   *  appears where the wide layout leaves room for it. */
  note?: string
}

const stops: Stop[] = [
  {
    year: '2018',
    place: 'Mahroni',
    text: 'Graduated having never cleared a written round. Wanted YouTube, needed a job. My father wanted a government teacher.',
    phase: 'before',
    story: '/my-story/before-bangalore/the-kitchen-table'
  },
  {
    year: '2018',
    place: 'The train',
    text: 'My sister backed me. One ticket to Bangalore and no plan beyond the first week.',
    phase: 'move',
    story: '/my-story/the-move/the-train-to-bangalore',
    guide: { to: '/bangalore/getting-there/the-train-from-home', label: 'Getting there' }
  },
  {
    year: '2018',
    place: 'BTM Layout',
    text: 'A PG where every room was a job seeker, and I found out how much I did not know.',
    phase: 'move',
    story: '/my-story/the-move/btm-layout-and-the-pg',
    guide: { to: '/bangalore/where-to-live/finding-a-pg', label: 'Finding a PG' }
  },
  {
    year: '2019',
    place: 'JSpiders',
    text: 'Three days of demo classes, then three months of Java, SQL and web.',
    phase: 'learning',
    story: '/my-story/learning/three-months-at-jspiders',
    guide: { to: '/java', label: 'Java, in depth' }
  },
  {
    year: '2019',
    place: '33 walk-ins',
    text: 'Aptitude, English and CS in parallel. Rejected, again and again, mostly in the written round.',
    phase: 'walkins',
    story: '/my-story/the-walk-ins/thirty-three-walk-ins',
    guide: { to: '/quantitative-aptitude', label: 'The written round' }
  },
  {
    year: '2019',
    place: 'The 34th',
    text: 'One of 700 to 1000 people in the queue. Selected.',
    phase: 'walkins',
    story: '/my-story/the-walk-ins/the-thirty-fourth',
    guide: { to: '/interview', label: 'The interview' },
    turn: true
  },
  {
    year: '2019',
    place: '₹13,000 a month',
    text: 'A startup, a bond, six days a week. Sundays for study.',
    phase: 'first-job',
    story: '/my-story/the-first-job/thirteen-thousand-a-month',
    guide: { to: '/bangalore/finding-a-job/taking-the-first-offer', label: 'Taking the first offer' },
    note: 'started at ₹13k in a startup'
  },
  {
    year: '2019',
    place: 'Accenture',
    text: 'I wanted web development. I got Salesforce, and it turned out to be the door.',
    phase: 'accenture',
    story: '/my-story/accenture/web-development-and-salesforce'
  },
  {
    year: '2022',
    place: 'Five offers',
    text: 'A friend was on 21 LPA while I was on 5. I switched: 15.5 LPA at Cognizant.',
    phase: 'switch',
    story: '/my-story/the-switch/five-offers',
    guide: { to: '/interview', label: 'Negotiation' },
    note: 'service companies, then product'
  },
  {
    year: '2023',
    place: 'Twilio',
    text: '30+ LPA, Salesforce analytics for the GTM team.',
    phase: 'switch',
    story: '/my-story/the-switch/twilio',
    note: 'close to eight years in, now in Europe'
  },
  {
    year: 'Now',
    place: 'Europe',
    text: 'Education First sponsored my visa. And I wrote the whole route down.',
    phase: 'europe',
    story: '/my-story/europe-and-why-this-exists/the-call-from-education-first'
  }
]

const colored = stops.map(stop => ({
  ...stop,
  phaseLabel: phases[stop.phase].label,
  color: trackStyle(phases[stop.phase].track).color
}))

const { journey } = useAppConfig()
const walkerImage = computed(() => (journey?.walkerImage || '').trim())

/* -----------------------------------------------------------------------------
   The road
   -------------------------------------------------------------------------- */

const root = useTemplateRef<HTMLElement>('root')
const base = useTemplateRef<SVGPathElement>('base')
const walked = useTemplateRef<SVGPathElement>('walked')
const walkerEl = useTemplateRef<HTMLElement>('walkerEl')

/** The SVG's size and the road through it, in the section's own pixels. */
const box = ref({ w: 0, h: 0 })
/** Smaller beside the narrow road on a phone. */
const walkerSize = ref(44)
const d = ref('')
/** How many stops the walker has reached (0 = none yet). */
const reached = ref(0)
/** `ready` once the road is drawn; `still` when motion is not wanted. */
const mode = ref<'static' | 'ready' | 'still'>('static')

const walkerColor = computed(() => colored[Math.max(0, reached.value - 1)]?.color || colored[0]!.color)
const walkerPhase = computed(() => colored[Math.max(0, reached.value - 1)]?.phaseLabel || colored[0]!.phaseLabel)

/** How far along the road each stop's node is. */
let stopAt: number[] = []
let total = 0

/** The length along the road at which it reaches height `y`. The road only
 *  ever runs downwards, so a binary search finds it. */
function lengthAtY(path: SVGPathElement, y: number) {
  let lo = 0
  let hi = total
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (path.getPointAtLength(mid).y < y) {
      lo = mid
    } else {
      hi = mid
    }
  }
  return (lo + hi) / 2
}

/** Measure the nodes and draw a smooth road through them. */
async function build() {
  const el = root.value
  if (!el) {
    return
  }
  const frame = el.getBoundingClientRect()
  const nodes = [...el.querySelectorAll<HTMLElement>('.stop__node')].map((node) => {
    const r = node.getBoundingClientRect()
    return { x: r.left + r.width / 2 - frame.left, y: r.top + r.height / 2 - frame.top }
  })
  if (nodes.length < 2) {
    return
  }

  const first = nodes[0]!
  const last = nodes[nodes.length - 1]!
  const lead = Math.min(48, first.y)
  let path = `M ${first.x.toFixed(1)} ${(first.y - lead).toFixed(1)} L ${first.x.toFixed(1)} ${first.y.toFixed(1)}`

  // Between two stops, an S-bend that leaves one node heading straight down
  // and arrives at the next heading straight down: a footpath, not a zigzag.
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1]!
    const b = nodes[i]!
    const k = (b.y - a.y) * 0.55
    path += ` C ${a.x.toFixed(1)} ${(a.y + k).toFixed(1)}, ${b.x.toFixed(1)} ${(b.y - k).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
  }
  path += ` L ${last.x.toFixed(1)} ${Math.min(frame.height, last.y + 48).toFixed(1)}`

  box.value = { w: frame.width, h: frame.height }
  walkerSize.value = frame.width >= 720 ? 44 : 36
  d.value = path
  await nextTick()

  const line = base.value
  if (!line) {
    return
  }
  total = line.getTotalLength()
  stopAt = nodes.map(node => lengthAtY(line, node.y))

  if (walked.value) {
    walked.value.style.strokeDasharray = `${total} ${total}`
  }
  update()
}

/** Move the walker to the point on the road level with the pane's middle. */
function update() {
  const el = root.value
  const line = base.value
  if (!el || !line || !total) {
    return
  }

  let length = total
  if (mode.value !== 'still') {
    const pane = paneEl()
    const view = pane ? pane.getBoundingClientRect() : { top: 0, height: window.innerHeight }
    const target = view.top + view.height * 0.55 - el.getBoundingClientRect().top
    const start = line.getPointAtLength(0).y
    const end = line.getPointAtLength(total).y
    length = target <= start ? 0 : target >= end ? total : lengthAtY(line, target)
  }

  if (walked.value) {
    walked.value.style.strokeDashoffset = `${total - length}`
  }

  const at = line.getPointAtLength(length)
  if (walkerEl.value) {
    walkerEl.value.style.transform = `translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px)`
  }

  const count = stopAt.filter(stop => stop <= length + 1).length
  if (count !== reached.value) {
    reached.value = count
  }
}

let frame = 0
function schedule() {
  frame ||= requestAnimationFrame(() => {
    frame = 0
    update()
  })
}

let cleanup = () => {}
onBeforeUnmount(() => cleanup())

onMounted(async () => {
  const el = root.value
  if (!el) {
    return
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  mode.value = reduced ? 'still' : 'ready'
  // Let the stops move to their final places before anything is measured.
  await nextTick()

  let resizeFrame = 0
  const resized = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(() => build())
  })
  resized.observe(el)

  const pane = paneEl()
  const target: HTMLElement | Window = pane || window
  let listening = false
  const listen = (on: boolean) => {
    if (on === listening || reduced) {
      return
    }
    listening = on
    if (on) {
      target.addEventListener('scroll', schedule, { passive: true })
      window.addEventListener('resize', schedule, { passive: true })
    } else {
      target.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }

  // Only follow the scroll while the road is on screen; update once on the
  // way out so the walker is parked at the right end.
  const seen = new IntersectionObserver(([entry]) => {
    listen(Boolean(entry?.isIntersecting))
    schedule()
  })
  seen.observe(el)

  cleanup = () => {
    resized.disconnect()
    seen.disconnect()
    listen(false)
    cancelAnimationFrame(frame)
    cancelAnimationFrame(resizeFrame)
  }
})
</script>

<template>
  <div
    ref="root"
    class="journey"
    :data-mode="mode"
  >
    <svg
      v-if="d"
      class="journey__road"
      :width="box.w"
      :height="box.h"
      :viewBox="`0 0 ${box.w} ${box.h}`"
      aria-hidden="true"
    >
      <path
        ref="base"
        :d="d"
        class="journey__ahead"
      />
      <path
        ref="walked"
        :d="d"
        class="journey__walked"
      />
    </svg>

    <div
      v-if="d && mode === 'ready'"
      ref="walkerEl"
      class="journey__walker"
      :style="{ '--walker-size': `${walkerSize}px` }"
    >
      <HomeJourneyWalker
        :color="walkerColor"
        :image="walkerImage"
        :size="walkerSize"
        :label="`You are here: ${walkerPhase}`"
      />
    </div>

    <ol class="journey__stops">
      <li
        v-for="(stop, index) in colored"
        :key="stop.place"
        class="stop"
        :data-side="index % 2 ? 'right' : 'left'"
        :data-in="(mode === 'still' || index < reached) || undefined"
        :data-turn="stop.turn || undefined"
        :style="{ '--phase': stop.color }"
      >
        <span
          class="stop__node"
          aria-hidden="true"
        />
        <span
          class="stop__leader"
          aria-hidden="true"
        />
        <p
          v-if="stop.note"
          class="stop__note handnote"
          aria-hidden="true"
        >
          {{ stop.note }}
        </p>

        <div class="stop__card">
          <p class="stop__year num">
            {{ stop.year }}
          </p>
          <p class="stop__phase label">
            <span
              class="stop__swatch"
              aria-hidden="true"
            />
            {{ stop.phaseLabel }}<template v-if="stop.turn">
              · the turn
            </template>
          </p>
          <h3 class="stop__place">
            <NuxtLink :to="stop.story">
              {{ stop.place }}
            </NuxtLink>
          </h3>
          <p class="stop__text">
            {{ stop.text }}
          </p>
          <p class="stop__links">
            <NuxtLink
              :to="stop.story"
              class="arrow-link"
            >
              The chapter
              <UIcon
                name="i-lucide-arrow-right"
                class="size-3.5"
              />
            </NuxtLink>
            <NuxtLink
              v-if="stop.guide"
              :to="stop.guide.to"
              class="arrow-link stop__guide"
            >
              {{ stop.guide.label }}
              <UIcon
                name="i-lucide-arrow-right"
                class="size-3.5"
              />
            </NuxtLink>
          </p>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.journey {
  --walker-size: 44px;
  position: relative;
  container: journey / inline-size;
}

/* ── The road ──────────────────────────────────────────────────────────── */
.journey__road {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: visible;
  pointer-events: none;
}

.journey__road path {
  fill: none;
  stroke-linecap: butt;
  stroke-linejoin: round;
}

/* The way ahead: faint and dashed. */
.journey__ahead {
  stroke: var(--ui-border-accented);
  stroke-width: 1.5;
  stroke-dasharray: 3 6;
}

/* The way walked: solid, in the accent. Drawn by the script, which sets its
   dash to the road's length and pulls the offset back as you scroll. */
.journey__walked {
  stroke: var(--ui-primary);
  stroke-width: 2;
}

.journey[data-mode='still'] .journey__walked {
  stroke-dashoffset: 0 !important;
}

/* Before the road is drawn (no JavaScript yet, or none at all), a plain
   hairline stands in for it, through the phone-width node column. */
.journey[data-mode='static']::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 1.375rem;
  width: 1px;
  background: var(--ui-border-accented);
}

.journey__walker {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 3;
  width: var(--walker-size);
  height: var(--walker-size);
  margin: calc(var(--walker-size) / -2) 0 0 calc(var(--walker-size) / -2);
  pointer-events: none;
  will-change: transform;
}

/* ── The stops: a column beside the road on a phone ───────────────────── */
.journey__stops {
  position: relative;
  z-index: 1;
}

.stop {
  --node-x: 0.875rem;
  position: relative;
  padding: 0 0 3rem 3.25rem;
}

.stop:nth-child(even) {
  --node-x: 1.875rem;
}

.stop:last-child {
  padding-bottom: 0.5rem;
}

.journey[data-mode='static'] .stop {
  --node-x: 1.375rem;
}

/* A small square on the road. Hollow until the walker reaches it, then
   filled in the colour of its phase. */
.stop__node {
  position: absolute;
  left: var(--node-x);
  top: 1.25rem;
  z-index: 2;
  width: 0.75rem;
  height: 0.75rem;
  border: 1px solid var(--ui-border-accented);
  background: var(--ui-bg);
  transform: translate(-50%, -50%);
  transition:
    background-color var(--dgm-t-base) var(--dgm-ease),
    border-color var(--dgm-t-base) var(--dgm-ease),
    transform var(--dgm-t-base) var(--dgm-ease);
}

.stop[data-in] .stop__node {
  border-color: var(--phase);
  background: var(--phase);
  transform: translate(-50%, -50%) scale(1.25);
}

.stop__leader {
  display: none;
}

/* The remark in Swarnil's hand, beside the road. Only where the winding
   layout leaves clear space for it: on a phone the column is too tight, so
   it stays hidden there. */
.stop__note {
  display: none;
}

.stop__year {
  font-size: clamp(2.25rem, 1.8rem + 2vw, 3.5rem);
  line-height: 0.9;
  font-weight: 700;
  letter-spacing: -0.05em;
  color: var(--ui-text-dimmed);
  transition: color var(--dgm-t-base) var(--dgm-ease);
}

.stop[data-in] .stop__year {
  color: var(--ui-text-highlighted);
}

.stop__phase {
  margin-top: 0.75rem;
}

.stop__swatch {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--phase);
}

.stop__place {
  margin-top: 0.375rem;
  font-size: var(--text-xl);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
}

.stop__place a:hover {
  color: var(--ui-primary);
}

.stop[data-turn] .stop__place {
  font-size: var(--text-2xl);
}

.stop__text {
  margin-top: 0.375rem;
  max-width: 30rem;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.stop__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.25rem;
  margin-top: 0.75rem;
}

.stop__links .arrow-link {
  font-size: var(--text-xs);
}

.stop__guide {
  color: var(--ui-text-muted);
}

/* ── Wide: the road winds down the middle, stops alternate either side ──
   The road swings between 40% and 60% of the width; a stop's card sits in
   the outer third on its side, joined to its node by a hairline. Alternate
   stops pull up into the gap left by the one before, so the two sides
   interlock and the bends come at an even pace. */
@container journey (min-width: 720px) {
  .stop,
  .stop:nth-child(even) {
    padding: 0;
  }

  .stop + .stop {
    margin-top: -4.5rem;
  }

  .stop[data-side='left'] {
    --node-x: 40%;
  }

  .stop[data-side='right'] {
    --node-x: 60%;
  }

  .journey[data-mode='static'] .stop {
    --node-x: 50%;
  }

  .journey[data-mode='static']::before {
    left: 50%;
  }

  .stop__card {
    width: calc(100% / 3);
    padding-bottom: 1.5rem;
  }

  .stop[data-side='right'] .stop__card {
    margin-left: calc(200% / 3);
  }

  .stop__leader {
    position: absolute;
    top: 1.25rem;
    display: block;
    height: 1px;
    background: var(--ui-border);
  }

  .stop[data-side='left'] .stop__leader {
    left: calc(100% / 3 + 0.75rem);
    right: calc(100% - var(--node-x) + 0.75rem);
  }

  .stop[data-side='right'] .stop__leader {
    left: calc(var(--node-x) + 0.75rem);
    right: calc(100% / 3 + 0.75rem);
  }

  .journey[data-mode='static'] .stop__leader {
    display: none;
  }

  /* The handwritten remark sits on the empty side of the node, clear of the
     card and the road. */
  .stop__note {
    position: absolute;
    top: 0.25rem;
    display: block;
    max-width: 13rem;
    font-size: 1.25rem;
    line-height: 1.1;
  }

  .stop[data-side='left'] .stop__note {
    left: calc(var(--node-x) + 3rem);
  }

  .stop[data-side='right'] .stop__note {
    right: calc(100% - var(--node-x) + 3rem);
  }

  .journey[data-mode='static'] .stop__note {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stop__node,
  .stop__year {
    transition: none;
  }
}
</style>
