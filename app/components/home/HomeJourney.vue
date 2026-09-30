<script setup lang="ts">
import { trackStyle } from '~/utils/tech'

/**
 * My journey, as a path. Every stop is a chapter of the story and, where there
 * is one, the part of the guide that teaches what that stop took, so the story
 * and the guide are one road.
 *
 * Every `story` URL is a real file under content/1.path/16.my-story/, with the
 * numeric prefixes dropped. Rename a chapter and this list has to follow.
 */
interface Stop {
  year: string
  place: string
  text: string
  icon: string
  /** The track whose colour the stop takes. */
  track: string
  story: string
  guide?: { to: string, label: string }
  turn?: boolean
}

const stops: Stop[] = [
  {
    year: '2018',
    place: 'Mahroni',
    text: 'Graduated having never cleared a written round. Wanted YouTube, needed a job. My father wanted a government teacher.',
    icon: 'i-lucide-house',
    track: 'my-story',
    story: '/my-story/before-bangalore/the-kitchen-table'
  },
  {
    year: '2018',
    place: 'The train',
    text: 'My sister backed me. One ticket to Bangalore and no plan beyond the first week.',
    icon: 'i-lucide-train-front',
    track: 'bangalore',
    story: '/my-story/the-move/the-train-to-bangalore',
    guide: { to: '/bangalore/getting-there/the-train-from-home', label: 'Getting there' }
  },
  {
    year: '2018',
    place: 'BTM Layout',
    text: 'A PG where every room was a job seeker, and I found out how much I did not know.',
    icon: 'i-lucide-bed-double',
    track: 'bangalore',
    story: '/my-story/the-move/btm-layout-and-the-pg',
    guide: { to: '/bangalore/where-to-live/finding-a-pg', label: 'Finding a PG' }
  },
  {
    year: '2019',
    place: 'JSpiders',
    text: 'Three days of demo classes, then three months of Java, SQL and web.',
    icon: 'i-simple-icons-openjdk',
    track: 'java',
    story: '/my-story/learning/three-months-at-jspiders',
    guide: { to: '/java', label: 'Java, in depth' }
  },
  {
    year: '2019',
    place: '33 walk-ins',
    text: 'Aptitude, English and CS in parallel. Rejected, again and again, mostly in the written round.',
    icon: 'i-lucide-clipboard-list',
    track: 'quantitative-aptitude',
    story: '/my-story/the-walk-ins/thirty-three-walk-ins',
    guide: { to: '/quantitative-aptitude', label: 'The written round' }
  },
  {
    year: '2019',
    place: 'The 34th',
    text: 'One of 700 to 1000 people in the queue. Selected.',
    icon: 'i-lucide-badge-check',
    track: 'interview',
    story: '/my-story/the-walk-ins/the-thirty-fourth',
    guide: { to: '/interview', label: 'The interview' },
    turn: true
  },
  {
    year: '2019',
    place: '₹13,000 a month',
    text: 'A startup, a bond, six days a week. Sundays for study.',
    icon: 'i-lucide-wallet',
    track: 'bangalore',
    story: '/my-story/the-first-job/thirteen-thousand-a-month',
    guide: { to: '/bangalore/finding-a-job/taking-the-first-offer', label: 'Taking the first offer' }
  },
  {
    year: '2019',
    place: 'Accenture',
    text: 'I wanted web development. I got Salesforce, and it turned out to be the door.',
    icon: 'i-lucide-building-2',
    track: 'dbms',
    story: '/my-story/accenture/web-development-and-salesforce'
  },
  {
    year: '2022',
    place: 'Five offers',
    text: 'A friend was on 21 LPA while I was on 5. I switched: 15.5 LPA at Cognizant.',
    icon: 'i-lucide-trending-up',
    track: 'logical-reasoning',
    story: '/my-story/the-switch/five-offers',
    guide: { to: '/interview', label: 'Negotiation' }
  },
  {
    year: '2023',
    place: 'Twilio',
    text: '30+ LPA, Salesforce analytics for the GTM team.',
    icon: 'i-lucide-rocket',
    track: 'oops',
    story: '/my-story/the-switch/twilio'
  },
  {
    year: 'Now',
    place: 'Europe',
    text: 'Education First sponsored my visa. And I wrote the whole route down.',
    icon: 'i-lucide-plane',
    track: 'my-story',
    story: '/my-story/europe-and-why-this-exists/the-call-from-education-first'
  }
]

const colored = stops.map(stop => ({ ...stop, color: trackStyle(stop.track).color }))

/** The line down the middle runs through every stop's colour in order. */
const line = `linear-gradient(to bottom, ${colored.map((stop, i) => `${stop.color} ${Math.round((i / (colored.length - 1)) * 100)}%`).join(', ')})`

/* -----------------------------------------------------------------------------
   Motion
   -----------------------------------------------------------------------------
   The road draws itself as you scroll down it, a marker travels along with
   you, and each stop slides in from its own side as it arrives.

   The road and the marker read one number, `--progress`, from 0 to 1. Where
   the browser has scroll-driven animations, CSS drives it from the page's
   scroll with no script at all. Elsewhere the script below computes the same
   number, and only listens to scroll while the journey is on screen.

   Everything starts visible. The hidden, about-to-slide-in state is only
   applied once this script has run (`data-animate`), so a reader without
   JavaScript, or a crawler, sees the whole road. With reduced motion on,
   nothing moves: the road is drawn and every stop is simply there.
   -------------------------------------------------------------------------- */
const root = useTemplateRef<HTMLElement>('root')
const animate = ref(false)
let cleanup = () => {}
onBeforeUnmount(() => cleanup())

onMounted(() => {
  const el = root.value
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!el || reduced || typeof IntersectionObserver === 'undefined') {
    return
  }
  animate.value = true

  // Each stop slides in once, as it enters, and then stays.
  const stopsObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        (entry.target as HTMLElement).dataset.in = ''
        stopsObserver.unobserve(entry.target)
      }
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 })
  el.querySelectorAll('.stop').forEach(stop => stopsObserver.observe(stop))

  // The road, where CSS cannot drive it from the scroll by itself.
  const scrollDriven = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')
  let stopRoad = () => {}
  if (!scrollDriven) {
    let frame = 0
    const update = () => {
      frame = 0
      const box = el.getBoundingClientRect()
      const middle = window.innerHeight / 2
      const progress = Math.min(1, Math.max(0, (middle - box.top) / Math.max(1, box.height)))
      el.style.setProperty('--progress', progress.toFixed(4))
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }
    const roadObserver = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onScroll, { passive: true })
        update()
      } else {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
        update()
      }
    })
    roadObserver.observe(el)
    stopRoad = () => {
      roadObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }

  cleanup = () => {
    stopsObserver.disconnect()
    stopRoad()
  }
})
</script>

<template>
  <div
    ref="root"
    class="journey-wrap"
    :data-animate="animate ? '' : undefined"
    :style="{ '--line': line }"
  >
    <!-- The drawn part of the road, and the marker that travels down it. -->
    <div
      class="road"
      aria-hidden="true"
    >
      <span class="road__fill" />
      <span class="road__marker">
        <UIcon
          name="i-lucide-footprints"
          class="size-3"
        />
      </span>
    </div>

    <ol class="journey">
      <li
        v-for="(stop, index) in colored"
        :key="stop.place"
        class="stop"
        :data-side="index % 2 ? 'right' : 'left'"
        :data-turn="stop.turn || undefined"
        :style="{ '--track': stop.color, '--i': index }"
      >
        <span class="stop__node">
          <UIcon
            :name="stop.icon"
            class="size-5"
          />
        </span>

        <div class="stop__card card-hover">
          <p class="stop__meta">
            <span class="stop__year">{{ stop.year }}</span>
            <span
              v-if="stop.turn"
              class="stop__flag"
            >the turn</span>
          </p>
          <h3 class="stop__place">
            <NuxtLink
              :to="stop.story"
              class="stop__title-link"
            >
              {{ stop.place }}
            </NuxtLink>
          </h3>
          <p class="stop__text">
            {{ stop.text }}
          </p>
          <p class="stop__links">
            <NuxtLink
              :to="stop.story"
              class="stop__link"
            >
              <UIcon
                name="i-lucide-footprints"
                class="size-3.5"
              />
              The chapter
            </NuxtLink>
            <NuxtLink
              v-if="stop.guide"
              :to="stop.guide.to"
              class="stop__link stop__link--guide"
            >
              <UIcon
                name="i-lucide-map"
                class="size-3.5"
              />
              {{ stop.guide.label }}
            </NuxtLink>
          </p>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
/* The number the road and the marker are drawn from, 0 at the first stop and 1
   at the last. Registered so that CSS can animate it from the scroll. */
@property --progress {
  syntax: '<number>';
  inherits: true;
  initial-value: 1;
}

.journey-wrap {
  position: relative;
  /* Stops slide in from the sides; never let that widen the page. */
  overflow-x: clip;
  overflow-y: visible;
  --road-x: 1.25rem;
}

.journey {
  position: relative;
  display: grid;
  gap: 1.25rem;
  padding-left: 3.25rem;
}

/* The road: a coloured line through every stop, with a dashed centre line
   painted on it. This is the faint, undrawn road; `.road__fill` is the part
   you have travelled. */
.journey::before,
.journey::after {
  content: '';
  position: absolute;
  top: 1.25rem;
  bottom: 1.25rem;
  left: var(--road-x);
  transform: translateX(-50%);
  border-radius: 999px;
}

.journey::before {
  width: 0.5rem;
  background: var(--line);
  opacity: 0.2;
}

.journey::after {
  width: 2px;
  background: repeating-linear-gradient(to bottom, var(--ui-bg) 0 6px, transparent 6px 14px);
  opacity: 0.9;
  pointer-events: none;
}

.road {
  position: absolute;
  top: 1.25rem;
  bottom: 1.25rem;
  /* Centred on the road without a transform: a transform would make this a
     stacking context and trap the marker underneath the stops. */
  left: calc(var(--road-x) - 0.25rem);
  width: 0.5rem;
  pointer-events: none;
}

.road__fill {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: var(--line);
  transform-origin: top;
  transform: scaleY(var(--progress));
}

/* The marker: you, on the road. Hidden until the script has decided motion is
   welcome, because a marker parked at the end of the road means nothing. */
.road__marker {
  position: absolute;
  left: 50%;
  top: calc(var(--progress) * 100%);
  /* Above the painted centre line, under the stop nodes it passes. */
  z-index: 1;
  display: none;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: var(--ui-bg);
  color: var(--ui-primary);
  border: 2px solid var(--ui-primary);
  box-shadow:
    0 0 0 3px color-mix(in oklab, var(--ui-primary) 18%, transparent),
    0 4px 12px rgb(0 0 0 / 0.18);
  transform: translate(-50%, -50%);
}

.journey-wrap[data-animate] {
  --progress: 0;
}

.journey-wrap[data-animate] .road__marker {
  display: flex;
}

/* Where the browser can, the page's own scroll drives the road: it starts
   drawing when the top of the journey reaches the middle of the screen and is
   finished when the bottom does. The script's fallback computes exactly this. */
@supports (animation-timeline: view()) {
  .journey-wrap[data-animate] {
    animation: road-draw linear both;
    animation-timeline: view();
    animation-range: cover 50vh cover calc(100% - 50vh);
  }
}

@keyframes road-draw {
  from {
    --progress: 0;
  }

  to {
    --progress: 1;
  }
}

.stop {
  position: relative;
}

.stop__node {
  position: absolute;
  left: -3.25rem;
  top: 0.5rem;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  background: var(--track);
  color: #fff;
  box-shadow:
    0 0 0 4px var(--ui-bg),
    0 0 0 6px color-mix(in oklab, var(--track) 35%, transparent);
}

.stop[data-turn] .stop__node {
  width: 2.75rem;
  height: 2.75rem;
  top: 0.375rem;
  left: -3.375rem;
  box-shadow:
    0 0 0 4px var(--ui-bg),
    0 0 0 7px var(--track),
    0 0 24px 6px color-mix(in oklab, var(--track) 45%, transparent);
}

.stop__card {
  padding: 0.875rem 1.125rem 1rem;
  border: 1px solid var(--ui-border);
  border-left: 3px solid var(--track);
  border-radius: 0;
  background: var(--ui-bg);
}

.stop[data-turn] .stop__card {
  background: color-mix(in oklab, var(--track) 7%, var(--ui-bg));
}

.stop__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.stop__year {
  font-family: var(--font-pixel);
  font-size: 0.9375rem;
  color: var(--track);
}

.dark .stop__year,
.dark .stop__flag {
  color: color-mix(in oklab, var(--track) 68%, white);
}

.stop__flag {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--track);
}

.stop__place {
  margin-top: 0.125rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ui-text-highlighted);
}

.stop__title-link:hover {
  text-decoration: underline;
  text-decoration-color: var(--track);
  text-underline-offset: 3px;
}

.stop__text {
  margin-top: 0.25rem;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.stop__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.stop__link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.55rem;
  border-radius: 2px;
  border: 1px solid var(--ui-border);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--ui-text-muted);
  transition:
    border-color var(--dgm-t-fast) var(--dgm-ease),
    color var(--dgm-t-fast) var(--dgm-ease);
}

.stop__link:hover {
  border-color: var(--track);
  color: var(--ui-text-highlighted);
}

/* ── Motion ─────────────────────────────────────────────────────────── */

/* Each stop waits off to its own side until it scrolls into view, then slides
   in. Left stops come from the left, right stops from the right; on a phone,
   where every stop is on the right of the road, they still alternate. */
.journey-wrap[data-animate] .stop {
  opacity: 0;
  transform: translateX(-1.5rem);
  transition:
    opacity 600ms var(--ease-out-im),
    transform 600ms var(--ease-out-im);
}

.journey-wrap[data-animate] .stop:nth-child(even) {
  transform: translateX(1.5rem);
}

.journey-wrap[data-animate] .stop[data-in] {
  opacity: 1;
  transform: none;
}

/* A slow ring off every node, staggered down the road so they breathe in turn
   rather than all at once. */
.stop__node::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 999px;
  border: 2px solid var(--track);
  opacity: 0;
  pointer-events: none;
}

.journey-wrap[data-animate] .stop[data-in] .stop__node::after {
  animation: node-pulse 3.2s var(--ease-out-im) infinite;
  animation-delay: calc(var(--i) * 0.28s);
}

@keyframes node-pulse {
  0% {
    opacity: 0.55;
    transform: scale(1);
  }

  70%,
  100% {
    opacity: 0;
    transform: scale(1.55);
  }
}

/* The turn glows in the accent, and keeps glowing. */
.stop[data-turn] .stop__card {
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--ui-primary) 45%, transparent),
    0 0 28px -6px color-mix(in oklab, var(--ui-primary) 55%, transparent);
}

.journey-wrap[data-animate] .stop[data-turn][data-in] .stop__node {
  animation: turn-glow 2.4s ease-in-out infinite;
}

@keyframes turn-glow {
  0%,
  100% {
    box-shadow:
      0 0 0 4px var(--ui-bg),
      0 0 0 7px var(--track),
      0 0 18px 4px color-mix(in oklab, var(--ui-primary) 40%, transparent);
  }

  50% {
    box-shadow:
      0 0 0 4px var(--ui-bg),
      0 0 0 7px var(--track),
      0 0 34px 12px color-mix(in oklab, var(--ui-primary) 60%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .journey-wrap {
    --progress: 1 !important;
    animation: none !important;
  }

  .road__marker {
    display: none !important;
  }

  .stop {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }

  .stop__node,
  .stop__node::after {
    animation: none !important;
  }
}

/* Wide screens: the road runs down the middle and the stops alternate either
   side of it, so the page reads as a route rather than as a list. */
@media (min-width: 900px) {
  .journey {
    padding-left: 0;
    gap: 0;
  }

  .journey-wrap {
    --road-x: 50%;
  }

  .stop {
    width: 50%;
    padding-block: 0.625rem;
  }

  .stop[data-side='left'] {
    padding-right: 2.75rem;
  }

  .stop[data-side='right'] {
    margin-left: 50%;
    padding-left: 2.75rem;
  }

  /* Pull alternate stops up so the two columns interlock. */
  .stop + .stop {
    margin-top: -2.5rem;
  }

  .stop__node {
    top: 1.25rem;
  }

  .stop[data-side='left'] .stop__node {
    left: auto;
    right: -1.25rem;
  }

  .stop[data-side='right'] .stop__node {
    left: -1.25rem;
  }

  .stop[data-turn][data-side='left'] .stop__node {
    right: -1.375rem;
  }

  .stop[data-turn][data-side='right'] .stop__node {
    left: -1.375rem;
  }

  .stop[data-side='left'] .stop__card {
    border-left-width: 1px;
    border-right: 3px solid var(--track);
    text-align: right;
  }

  .stop[data-side='left'] .stop__meta {
    flex-direction: row-reverse;
  }

  .stop[data-side='left'] .stop__links {
    justify-content: flex-end;
  }

  .journey-wrap[data-animate] .stop[data-side='left'] {
    transform: translateX(-2.5rem);
  }

  .journey-wrap[data-animate] .stop[data-side='right'] {
    transform: translateX(2.5rem);
  }

  .journey-wrap[data-animate] .stop[data-in] {
    transform: none;
  }
}
</style>
