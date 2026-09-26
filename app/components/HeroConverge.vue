<script setup lang="ts">
import { logoMark } from '~/utils/logo'
import { findTech } from '~/utils/tech'

/**
 * Everything scattered, gathering into one book.
 *
 * The argument the whole site makes, in one loop. The subjects are not hidden
 * and they are not scarce — operating systems, DBMS, Java, DSA, networks, Git
 * are all out there already, free, and that abundance is the problem. They
 * arrive from every direction with no order to them, drift about untethered,
 * and then fall into a single volume that says what to read and when.
 *
 * The chips are real components rather than drawn logos, so they stay in step
 * with the tech registry the rest of the site uses. Positions are laid out on
 * an ellipse from a deterministic formula — nothing random, because the server
 * render and the hydrated one have to agree.
 *
 * Everything is measured in `cqw`, one percent of the illustration's own width,
 * so the scatter scales with the box instead of bursting out of it on a phone.
 */
const SUBJECTS = [
  'os',
  'mysql',
  'java',
  'dsa',
  'networks',
  'oops',
  'system-design',
  'git',
  'html',
  'css',
  'python',
  'interview'
] as const

const chips = SUBJECTS.map((name, index) => {
  const angle = (index / SUBJECTS.length) * Math.PI * 2
  // Deterministic jitter, so the ring never looks like a clock face.
  const wobble = ((index * 37) % 11) - 5

  return {
    name,
    tech: findTech(name),
    x: Number((Math.cos(angle) * (45 + wobble * 0.7)).toFixed(1)),
    y: Number((Math.sin(angle) * (34 + wobble * 0.6)).toFixed(1)),
    tilt: ((index * 53) % 26) - 13,
    step: index
  }
})
</script>

<template>
  <div class="cv">
    <div class="cv__stage">
      <!-- The chips. Each one starts out where nobody put it, drifts, and then
           falls into the book. -->
      <span
        v-for="chip in chips"
        :key="chip.name"
        class="cv__chip"
        :style="{
          '--x': chip.x,
          '--y': chip.y,
          '--tilt': `${chip.tilt}deg`,
          '--step': chip.step,
          '--tech': chip.tech?.color || 'var(--ui-primary)'
        }"
        :title="chip.tech?.label"
      >
        <UIcon
          :name="chip.tech?.icon || 'i-lucide-file-text'"
          class="cv__chip-icon"
        />
      </span>

      <!-- The book everything lands in. -->
      <div class="cv__book">
        <svg
          viewBox="0 0 168 212"
          class="cv__book-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-labelledby="cv-title cv-desc"
        >
          <title id="cv-title">Job Seekers Guide, as one book</title>
          <desc id="cv-desc">
            The subjects of a computer science curriculum — operating systems,
            databases, Java, data structures, networks and the rest — arriving
            from every direction and gathering into a single bound volume
            titled Job Seekers Guide.
          </desc>

          <defs>
            <linearGradient
              id="cv-cover"
              x1="14"
              y1="6"
              x2="150"
              y2="206"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0"
                class="cv__cover-1"
              />
              <stop
                offset="0.55"
                class="cv__cover-2"
              />
              <stop
                offset="1"
                class="cv__cover-3"
              />
            </linearGradient>
          </defs>

          <!-- The block of pages, offset behind the board. -->
          <rect
            x="20"
            y="12"
            width="140"
            height="194"
            rx="5"
            class="cv__pages-back"
          />
          <rect
            x="18"
            y="9"
            width="140"
            height="194"
            rx="5"
            class="cv__pages"
          />

          <!-- The board. -->
          <rect
            x="10"
            y="4"
            width="142"
            height="196"
            rx="4"
            fill="url(#cv-cover)"
          />
          <rect
            x="10"
            y="4"
            width="15"
            height="196"
            rx="4"
            class="cv__spine"
          />
          <rect
            x="24"
            y="4"
            width="2"
            height="196"
            fill="#000"
            opacity="0.35"
          />

          <!-- Gilt rules. A guide that claims to be the one book had better
               look like it was bound rather than printed. -->
          <rect
            x="34"
            y="18"
            width="104"
            height="168"
            rx="3"
            class="cv__rule"
            stroke-width="1.4"
            opacity="0.55"
          />

          <!-- The mark, on the cover, at the size a spine emblem would be. -->
          <g
            class="cv__emblem"
            transform="translate(70 44) scale(0.9)"
          >
            <rect
              v-for="(row, index) in logoMark.rows"
              :key="index"
              :x="row.x"
              :y="row.y"
              :width="row.w"
              :height="row.h"
              :rx="row.h / 2"
              :class="row.match ? 'cv__mark-accent' : 'cv__mark'"
            />
            <circle
              :cx="logoMark.lens.cx"
              :cy="logoMark.lens.cy"
              :r="logoMark.lens.r"
              class="cv__lens"
              :stroke-width="logoMark.lensWidth"
              fill="none"
            />
            <path
              :d="logoMark.handle"
              class="cv__lens"
              :stroke-width="logoMark.handleWidth"
              stroke-linecap="round"
              fill="none"
            />
          </g>

          <g class="cv__title">
            <text
              x="88"
              y="112"
              text-anchor="middle"
              class="cv__word"
            >JOB</text>
            <text
              x="88"
              y="136"
              text-anchor="middle"
              class="cv__word"
            >SEEKERS</text>
            <text
              x="88"
              y="160"
              text-anchor="middle"
              class="cv__word cv__word--accent"
            >GUIDE</text>
          </g>

          <rect
            x="66"
            y="172"
            width="44"
            height="1.6"
            rx="0.8"
            class="cv__underline"
          />

          <!-- The ribbon, because every book somebody keeps has one. -->
          <path
            d="M124 4V44L117 37L110 44V4Z"
            class="cv__ribbon"
          />
        </svg>
      </div>

      <!-- The glow the chips fall into. -->
      <span
        class="cv__glow"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style scoped>
.cv {
  width: 100%;
}

/* `container-type` is what makes `cqw` mean "one percent of this box", which is
   what lets the scatter, the chips and the book all scale together. */
/* `container-type` is what makes `cqw` mean "one percent of this box"; the
   perspective is what lets the book turn at the end rather than skew. */
.cv__stage {
  container-type: inline-size;
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  perspective: 1100px;
  /* No panel. The book stands on the page rather than on a coloured card —
     `overflow` still clips, so a chip can never land on the headline. */
  overflow: hidden;
}

.cv__glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 62cqw;
  height: 62cqw;
  translate: -50% -50%;
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in oklab, var(--color-guide-400) 18%, transparent), transparent 66%);
  opacity: 0;
  pointer-events: none;
  animation: cv-glow var(--cycle) ease-in-out infinite;
}

.cv__stage :is(.cv__chip, .cv__book, .cv__glow, .cv__gilt, .cv__title, .cv__emblem) {
  --cycle: 11s;
}

/* ── The scatter ──────────────────────────────────────────────────────── */

.cv__chip {
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  place-items: center;
  width: 11cqw;
  height: 11cqw;
  border-radius: 2.6cqw;
  background: color-mix(in oklab, var(--tech) 16%, #fff);
  border: 1px solid color-mix(in oklab, var(--tech) 34%, transparent);
  box-shadow: 0 1cqw 3cqw rgb(16 19 64 / 0.12);
  opacity: 0;
  animation: cv-converge var(--cycle) cubic-bezier(0.5, 0, 0.2, 1) infinite;
  /* Staggered so they arrive one after another. Kept well under a second in
     total, or the last chip lands after the title has already settled. */
  animation-delay: calc(var(--step) * 0.09s);
}

.cv__chip-icon {
  width: 5.6cqw;
  height: 5.6cqw;
  color: color-mix(in oklab, var(--tech) 78%, #000);
}

@keyframes cv-converge {
  /* Thrown in from outside the frame, unordered. */
  0% {
    transform:
      translate(-50%, -50%)
      translate(calc(var(--x) * 1.7cqw), calc(var(--y) * 1.7cqw))
      rotate(calc(var(--tilt) * 2)) scale(0.6);
    opacity: 0;
  }
  6% {
    opacity: 1;
  }
  /* Hanging there, drifting. This is the part of the loop that is the problem
     rather than the solution — everything available, nothing in an order. */
  20% {
    transform:
      translate(-50%, -50%)
      translate(calc(var(--x) * 1cqw), calc(var(--y) * 1cqw))
      rotate(var(--tilt)) scale(1);
    opacity: 1;
  }
  42% {
    transform:
      translate(-50%, -50%)
      translate(calc(var(--x) * 1.08cqw), calc(var(--y) * 1.12cqw))
      rotate(calc(var(--tilt) * -0.6)) scale(1);
    opacity: 1;
  }
  /* Falling in. */
  72% {
    transform: translate(-50%, -50%) rotate(0deg) scale(0.24);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) rotate(0deg) scale(0.24);
    opacity: 0;
  }
}

/* ── The book ─────────────────────────────────────────────────────────── */

.cv__book {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 52cqw;
  translate: -50% -50%;
  transform-style: preserve-3d;
  animation: cv-book var(--cycle) cubic-bezier(0.3, 0.8, 0.3, 1) infinite;
  filter: drop-shadow(0 3cqw 5cqw rgb(16 19 64 / 0.28));
}

.cv__book-svg {
  display: block;
  width: 100%;
  height: auto;
}

@keyframes cv-book {
  0%, 22% { transform: scale(0.94) rotateY(0deg) }
  /* Takes the weight as the chips land. */
  72% { transform: scale(1.05) rotateY(0deg) }
  /* Then turns to face the copy beside it, and holds there. A book that
     finishes square-on is a picture of a book; one that has turned toward the
     reader is being handed to them. */
  86% { transform: scale(1) rotateY(-13deg) rotateX(3deg) }
  94%, 100% { transform: scale(1) rotateY(-17deg) rotateX(4deg) }
}

@keyframes cv-glow {
  0%, 40% { opacity: 0 }
  74% { opacity: 0.9 }
  100% { opacity: 0 }
}

/* ── The book's colours ─────────────────────────────────────────────────
   These were nine hard-coded hex values left over from the indigo-and-teal
   palette, so the one illustration on the front page was the only thing on
   the site still wearing the old colours. They are tokens now, which means
   the book follows the design system and follows the theme.

   `fill` and `stroke` are CSS properties, so a class works on an SVG element
   exactly as it would on a div. Presentation attributes were only ever the
   shorthand. */
/* The cover runs 500 → 700 rather than 700 → 950. The darker version read as
   almost black with a red tint: a book you would not pick up, and it lost the
   accent entirely at the spine where the gradient ended. Three lighter stops
   keep it recognisably the brand colour across the whole board, and the type
   still clears contrast comfortably against the darkest of them. */
.cv__cover-1 { stop-color: var(--color-guide-500); }
.cv__cover-2 { stop-color: var(--color-guide-600); }
.cv__cover-3 { stop-color: var(--color-guide-700); }

.cv__pages-back { fill: var(--color-ink-300); }
.cv__pages      { fill: var(--color-ink-100); }

/* The spine is the one dark element, and it is a shade of the accent rather
   than black, so the board does not look like it is sitting on a hole. */
.cv__spine { fill: var(--color-guide-800); }

/* The rules, the underline and the mark are all lighter than the cover now
   rather than darker, which is what makes them read as embossed on it. */
.cv__rule {
  fill: none;
  stroke: var(--color-guide-100);
  opacity: 0.45;
}

.cv__mark        { fill: var(--color-guide-200); opacity: 0.85; }
.cv__mark-accent { fill: var(--color-ink-50); }
.cv__lens        { stroke: var(--color-ink-50); }

.cv__underline {
  fill: var(--color-guide-100);
  opacity: 0.55;
}

.cv__ribbon {
  fill: var(--color-guide-300);
  opacity: 0.95;
}

.cv__word {
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 800;
  letter-spacing: 1.2px;
  fill: var(--color-ink-50);
}

/* On a lighter cover, guide-400 on guide-600 is nearly invisible. The third
   word is distinguished by being the only one that is NOT full white, which
   reads as embossed rather than as a second colour. */
.cv__word--accent {
  fill: var(--color-guide-100);
  opacity: 0.85;
}

/* The lettering only resolves once the book has something in it. */
.cv__title,
.cv__emblem {
  animation: cv-lettering var(--cycle) ease-out infinite;
}

.cv__gilt {
  stroke-dasharray: 560;
  animation: cv-gilt var(--cycle) ease-out infinite;
}

@keyframes cv-lettering {
  0% { opacity: 0.25 }
  30% { opacity: 0.35 }
  76%, 100% { opacity: 1 }
}

@keyframes cv-gilt {
  0%, 34% { stroke-dashoffset: 560 }
  74%, 100% { stroke-dashoffset: 0 }
}

/* The still frame is the answer, not the mess: the book bound, lettered, with
   the subjects settled around it. */
@media (prefers-reduced-motion: reduce) {
  .cv__stage :is(.cv__chip, .cv__book, .cv__glow, .cv__gilt, .cv__title, .cv__emblem) {
    animation: none;
  }

  .cv__chip {
    opacity: 1;
    transform:
      translate(-50%, -50%)
      translate(calc(var(--x) * 1cqw), calc(var(--y) * 1cqw))
      rotate(var(--tilt));
  }

  .cv__book {
    transform: rotateY(-17deg) rotateX(4deg);
    opacity: 1;
  }

  .cv__gilt {
    stroke-dashoffset: 0;
  }

  .cv__glow {
    opacity: 0.35;
  }
}
</style>
