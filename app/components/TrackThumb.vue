<script setup lang="ts">
import { trackStyle } from '~/utils/tech'

/**
 * A track's picture.
 *
 * When the track's `index.md` sets `image:`, that photo is used, under a wash
 * of the track colour so the text on top stays readable. Until then the
 * picture is generated: a gradient in the track's own colour, a pattern chosen
 * from the slug, a winding road across it (this is a guide to a route, after
 * all) and the track's icon, large. Deterministic, so the server render and the
 * browser agree, and nothing to download.
 */
const props = withDefaults(defineProps<{
  slug?: string
  icon?: string
  image?: string
  /** Shown small in the corner of a `banner`. */
  label?: string
  /** `card` for a grid tile, `banner` for a track header, `square` for a list row. */
  variant?: 'card' | 'banner' | 'square'
}>(), {
  variant: 'card'
})

const style = computed(() => trackStyle(props.slug, props.icon))

function hash(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const seed = computed(() => hash(props.slug || props.icon || 'guide'))
const pattern = computed(() => ['grid', 'dots', 'rays', 'rings'][seed.value % 4])

/** A road that winds across the tile, a different bend for every track. */
const road = computed(() => {
  const s = seed.value
  const y1 = 70 + (s % 25)
  const y2 = 20 + ((s >> 3) % 30)
  const y3 = 55 + ((s >> 6) % 30)
  return `M -10 ${y1} C 40 ${y1 - 30}, 60 ${y2 + 40}, 100 ${y2} S 170 ${y3 - 30}, 210 ${y3}`
})

const failed = ref(false)
</script>

<template>
  <span
    class="thumb"
    :data-variant="variant"
    :data-pattern="pattern"
    :style="{ '--track': style.color }"
    aria-hidden="true"
  >
    <img
      v-if="image && !failed"
      :src="image"
      alt=""
      loading="lazy"
      decoding="async"
      class="thumb__photo"
      @error="failed = true"
    >

    <template v-else>
      <span class="thumb__pattern" />
      <svg
        class="thumb__road"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
      >
        <path
          :d="road"
          fill="none"
          stroke="currentColor"
          stroke-width="7"
          stroke-linecap="round"
          opacity="0.18"
        />
        <path
          :d="road"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-dasharray="4 5"
          stroke-linecap="round"
          opacity="0.55"
        />
      </svg>
      <UIcon
        :name="style.icon"
        class="thumb__ghost"
      />
    </template>

    <span class="thumb__badge">
      <UIcon
        :name="style.icon"
        class="thumb__glyph"
      />
    </span>

    <span
      v-if="label && variant === 'banner'"
      class="thumb__label"
    >{{ label }}</span>
  </span>
</template>

<style scoped>
.thumb {
  position: relative;
  display: block;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-lg);
  color: #fff;
  background:
    radial-gradient(120% 90% at 100% 0%, color-mix(in oklab, var(--track) 60%, white) 0%, transparent 55%),
    linear-gradient(135deg, var(--track), color-mix(in oklab, var(--track) 45%, #0a0a0a));
  isolation: isolate;
}

.thumb[data-variant='banner'] {
  aspect-ratio: auto;
  height: 100%;
  min-height: 9rem;
  border-radius: var(--radius-xl);
}

.thumb[data-variant='square'] {
  aspect-ratio: 1;
  border-radius: var(--radius-md);
}

.thumb__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

/* A photo still wears the track's colour, faintly, so a grid of photos reads as
   one guide and the badge on top stays legible. */
.thumb:has(.thumb__photo)::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, color-mix(in oklab, var(--track) 35%, transparent), rgb(0 0 0 / 0.45));
  z-index: -1;
}

.thumb__pattern {
  position: absolute;
  inset: 0;
  opacity: 0.22;
}

.thumb[data-pattern='grid'] .thumb__pattern {
  background-image:
    linear-gradient(to right, rgb(255 255 255 / 0.6) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 0.6) 1px, transparent 1px);
  background-size: 14px 14px;
}

.thumb[data-pattern='dots'] .thumb__pattern {
  background-image: radial-gradient(rgb(255 255 255 / 0.8) 1.2px, transparent 1.2px);
  background-size: 12px 12px;
}

.thumb[data-pattern='rays'] .thumb__pattern {
  background-image: repeating-linear-gradient(-45deg, rgb(255 255 255 / 0.5) 0 1px, transparent 1px 10px);
}

.thumb[data-pattern='rings'] .thumb__pattern {
  background-image: repeating-radial-gradient(circle at 10% 120%, rgb(255 255 255 / 0.5) 0 1px, transparent 1px 14px);
}

.thumb__road {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.thumb__ghost {
  position: absolute;
  right: -6%;
  bottom: -18%;
  width: 62%;
  height: auto;
  aspect-ratio: 1;
  opacity: 0.16;
  transform: rotate(-12deg);
}

.thumb[data-variant='square'] .thumb__ghost {
  display: none;
}

.thumb__badge {
  position: absolute;
  left: 0.75rem;
  top: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  background: rgb(255 255 255 / 0.18);
  border: 1px solid rgb(255 255 255 / 0.3);
  backdrop-filter: blur(4px);
}

.thumb[data-variant='banner'] .thumb__badge {
  left: 1.25rem;
  top: 1.25rem;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--radius-lg);
}

.thumb[data-variant='square'] .thumb__badge {
  inset: 0;
  margin: auto;
  width: 60%;
  height: 60%;
  background: transparent;
  border: 0;
  backdrop-filter: none;
}

.thumb__glyph {
  width: 1.35rem;
  height: 1.35rem;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.3));
}

.thumb[data-variant='banner'] .thumb__glyph {
  width: 1.75rem;
  height: 1.75rem;
}

.thumb__label {
  position: absolute;
  left: 1.25rem;
  bottom: 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.85);
}
</style>
