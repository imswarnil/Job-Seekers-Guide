<script setup lang="ts">
import { trackStyle } from '~/utils/tech'

/**
 * A line drawing for the track a page belongs to: the train for Bangalore, the
 * coffee cup for Java, the binary tree for DSA. Decorative, drawn in the
 * track's colour, and animated once on arrival as if a pen were drawing it
 * (stroke-dashoffset run out to zero, one path after another). With reduced
 * motion on, the finished drawing is simply there.
 *
 * Hand-authored 2px line art on a 96×96 canvas, stroked in `currentColor` so
 * the one `--track` variable colours the whole picture in both colour modes
 * (`.track-ink` in main.css does the dark-mode lightening).
 */
const props = defineProps<{
  /** The track's URL slug: `java`, `dsa`, `my-story`… */
  slug?: string
}>()

/** Each drawing is a list of stroked paths, drawn in order. */
const art: Record<string, string[]> = {
  // The front of a train, headlights on.
  'bangalore': [
    'M32 12 H64 C71 12 76 17 76 24 V66 C76 70 73 73 69 73 H27 C23 73 20 70 20 66 V24 C20 17 25 12 32 12 Z',
    'M30 24 H66 V42 H30 Z',
    'M33 56 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
    'M53 56 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
    'M26 78 L36 86 H60 L70 78',
    'M18 92 H78'
  ],
  // A cup of coffee, steam rising.
  'java': [
    'M28 42 H64 V62 A14 14 0 0 1 50 76 H42 A14 14 0 0 1 28 62 Z',
    'M64 47 H68 A8 8 0 0 1 68 63 H64',
    'M40 32 C36 27 44 23 40 17',
    'M52 32 C48 27 56 23 52 17',
    'M24 84 H68'
  ],
  // A binary tree: root, two children, four leaves.
  'dsa': [
    'M44 31 L32 49',
    'M52 31 L64 49',
    'M25 59 L20 73',
    'M31 59 L36 73',
    'M65 59 L60 73',
    'M71 59 L76 73',
    'M42 26 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0',
    'M22 54 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0',
    'M62 54 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0',
    'M14 78 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
    'M34 78 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
    'M54 78 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
    'M74 78 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'
  ],
  // The database cylinder, three plates high.
  'sql': [
    'M28 24 a20 8 0 1 0 40 0 a20 8 0 1 0 -40 0',
    'M28 24 V72',
    'M68 24 V72',
    'M28 40 a20 8 0 0 0 40 0',
    'M28 56 a20 8 0 0 0 40 0',
    'M28 72 a20 8 0 0 0 40 0'
  ],
  // A table: header row, rows, columns.
  'dbms': [
    'M20 22 H76 V74 H20 Z',
    'M20 36 H76',
    'M20 49 H76',
    'M20 62 H76',
    'M39 36 V74',
    'M58 36 V74'
  ],
  // Boxes inside boxes: objects holding objects.
  'oops': [
    'M20 20 H76 V76 H20 Z',
    'M31 31 H65 V65 H31 Z',
    'M42 42 H54 V54 H42 Z'
  ],
  // A CPU package, pins out on all four sides.
  'operating-systems': [
    'M28 28 H68 V68 H28 Z',
    'M41 41 H55 V55 H41 Z',
    'M36 28 V16', 'M48 28 V16', 'M60 28 V16',
    'M36 68 V80', 'M48 68 V80', 'M60 68 V80',
    'M28 36 H16', 'M28 48 H16', 'M28 60 H16',
    'M68 36 H80', 'M68 48 H80', 'M68 60 H80'
  ],
  // One node talking to three.
  'computer-networks': [
    'M48 26 V42',
    'M53 51 L71 57',
    'M43 51 L25 57',
    'M42 48 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0',
    'M43 18 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
    'M73 60 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
    'M13 60 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0'
  ],
  // A document with a tag inside it.
  'html': [
    'M30 12 H58 L70 24 V84 H30 Z',
    'M58 12 V24 H70',
    'M44 44 L36 54 L44 64',
    'M54 44 L62 54 L54 64'
  ],
  // A paint roller, mid-coat, and the swatch it left.
  'css': [
    'M22 20 H58 V36 H22 Z',
    'M58 28 H70 V44 H50 V48',
    'M46 48 H54 V72 H46 Z',
    'M24 56 H36 V68 H24 Z'
  ],
  // The braces, and the bolt between them.
  'javascript': [
    'M36 22 C30 22 32 32 32 38 C32 44 26 48 26 48 C26 48 32 52 32 58 C32 64 30 74 36 74',
    'M60 22 C66 22 64 32 64 38 C64 44 70 48 70 48 C70 48 64 52 64 58 C64 64 66 74 60 74',
    'M52 28 L42 50 H52 L44 68'
  ],
  // Three books, stacked flat.
  'other-subjects': [
    'M20 60 H76 V74 H20 Z',
    'M26 46 H70 V60 H26 Z',
    'M32 32 H64 V46 H32 Z',
    'M28 60 V74',
    'M64 46 V60',
    'M58 32 V46'
  ],
  // A percent sign and a die.
  'quantitative-aptitude': [
    'M20 50 L56 14',
    'M19 20 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0',
    'M43 44 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0',
    'M52 54 H84 V86 H52 Z',
    'M58.4 62 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0',
    'M66.4 70 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0',
    'M74.4 78 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0'
  ],
  // One jigsaw piece: two knobs out, one flat side.
  'logical-reasoning': [
    'M26 34 H38 A8 8 0 1 1 54 34 H66 V46 A8 8 0 1 0 66 62 V74 H54 A8 8 0 1 1 38 74 H26 Z'
  ],
  // A speech bubble with two lines said in it.
  'verbal-ability': [
    'M20 22 H76 V60 H46 L32 74 V60 H20 Z',
    'M30 36 H66',
    'M30 46 H54'
  ],
  // Two table microphones, facing each other.
  'interview': [
    'M26 22 a8 8 0 0 1 16 0 v12 a8 8 0 0 1 -16 0 Z',
    'M20 36 a14 14 0 0 0 28 0',
    'M34 50 V60',
    'M26 60 H42',
    'M54 30 a8 8 0 0 1 16 0 v12 a8 8 0 0 1 -16 0 Z',
    'M48 44 a14 14 0 0 0 28 0',
    'M62 58 V68',
    'M54 68 H70'
  ],
  // Footprints, walking up and to the right.
  'my-story': [
    'M26 66 a7 10 0 1 0 14 0 a7 10 0 1 0 -14 0',
    'M31 50 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0',
    'M51 44 a7 10 0 1 0 14 0 a7 10 0 1 0 -14 0',
    'M56 28 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0',
    'M76 22 a7 10 0 1 0 14 0 a7 10 0 1 0 -14 0',
    'M81 6 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0'
  ]
}

/** An open book, for a track the map has not heard of. */
const fallbackArt = [
  'M48 28 C41 22 30 21 22 25 V70 C30 66 41 67 48 73 C55 67 66 66 74 70 V25 C66 21 55 22 48 28 Z',
  'M48 28 V73'
]

const paths = computed(() => (props.slug && art[props.slug]) || fallbackArt)
const color = computed(() => trackStyle(props.slug).color)

const root = useTemplateRef<SVGSVGElement>('root')

/**
 * The draw-on. Each path is hidden behind its own length of dash, then let go
 * in order; the whole picture takes about 1.2 seconds however many strokes it
 * has. Run once per drawing; never under reduced motion.
 */
function draw() {
  const svg = root.value
  if (!svg || !import.meta.client) {
    return
  }
  const strokes = Array.from(svg.querySelectorAll('path'))
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const stroke of strokes) {
      stroke.style.removeProperty('stroke-dasharray')
      stroke.style.removeProperty('stroke-dashoffset')
      stroke.style.removeProperty('transition')
    }
    return
  }
  const step = strokes.length > 1 ? 0.6 / (strokes.length - 1) : 0
  strokes.forEach((stroke, index) => {
    const length = stroke.getTotalLength()
    stroke.style.transition = 'none'
    stroke.style.strokeDasharray = `${length}`
    stroke.style.strokeDashoffset = `${length}`
    // Flush, so the transition below starts from hidden rather than skipping.
    void stroke.getBoundingClientRect()
    stroke.style.transition = `stroke-dashoffset 0.6s var(--ease-out-im, ease-out) ${(index * step).toFixed(3)}s`
    stroke.style.strokeDashoffset = '0'
  })
}

onMounted(draw)

// A client-side navigation reuses this component; a new track means a new
// drawing, which deserves its own reveal.
watch(() => props.slug, async () => {
  await nextTick()
  draw()
})
</script>

<template>
  <svg
    ref="root"
    class="ti track-ink"
    :style="{ '--track': color }"
    viewBox="0 0 96 96"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-for="d in paths"
      :key="d"
      :d="d"
    />
  </svg>
</template>

<style scoped>
.ti {
  display: block;
  width: 100%;
  height: 100%;
}

.ti path {
  fill: none;
  stroke: currentColor;
  /* The drawing renders at roughly twice its 96px canvas, so 1.25 user units
     lands near a 2px pen on screen. Not `vector-effect: non-scaling-stroke`:
     that also stops the dash pattern scaling, which breaks the draw-on. */
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
