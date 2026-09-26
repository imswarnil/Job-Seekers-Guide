<script setup lang="ts">
/**
 * ::story-media — a picture or a film, or the space one will go in.
 *
 * The story is a personal account and it wants faces, places and footage. None
 * of that exists yet, and a page that simply omits it looks finished when it is
 * not. So this renders a real, deliberate placeholder: the right shape, the
 * right position in the flow, and a label saying what belongs there.
 *
 * That is a different thing from a broken image. A reader understands "a photo
 * of the Kota coaching centre goes here" and reads on; a grey box with a torn
 * icon reads as a bug. And when the real file arrives, one attribute changes
 * and the layout does not move, because the placeholder already reserved the
 * exact space.
 *
 * ```md
 * ::story-media{kind="video" label="The first vlog, shot the night before Bangalore" src=""}
 * Two minutes, a borrowed phone, and a haircut I would not defend.
 * ::
 * ```
 *
 * `src` empty or absent → the placeholder. `src` set → the real thing, with the
 * caption underneath either way.
 */
const props = withDefaults(defineProps<{
  /** `image` reserves 3:2, `video` reserves 16:9 and gets a play mark. */
  kind?: 'image' | 'video'
  /** What belongs here. Written for whoever has to go and find it. */
  label?: string
  /** The file, once it exists. Empty renders the placeholder. */
  src?: string
  /** Required when `src` is an image, and it is not the caption. */
  alt?: string
  /** `wide` breaks out of the reading column; `full` spans the whole band. */
  width?: 'column' | 'wide'
}>(), {
  kind: 'image',
  width: 'column'
})

const ready = computed(() => Boolean(props.src))

const ratio = computed(() => props.kind === 'video' ? '16 / 9' : '3 / 2')
</script>

<template>
  <figure
    class="media not-prose"
    :data-width="width"
    :data-kind="kind"
  >
    <div
      class="media__frame"
      :style="{ aspectRatio: ratio }"
    >
      <!-- The real thing. -->
      <img
        v-if="ready && kind === 'image'"
        :src="src"
        :alt="alt || ''"
        class="media__img"
        loading="lazy"
      >
      <video
        v-else-if="ready"
        :src="src"
        class="media__img"
        controls
        preload="none"
      />

      <!-- Or the space it will occupy. -->
      <template v-else>
        <!-- The hatch is drawn rather than an image, so it costs nothing and
             follows the theme. -->
        <svg
          class="media__hatch"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="story-media-hatch"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="8"
                stroke="currentColor"
                stroke-width="1"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#story-media-hatch)"
          />
        </svg>

        <div class="media__note">
          <UIcon
            :name="kind === 'video' ? 'i-lucide-play' : 'i-lucide-image'"
            class="media__icon"
          />
          <p class="media__kind">
            {{ kind === 'video' ? 'Film' : 'Photograph' }} to come
          </p>
          <p
            v-if="label"
            class="media__label"
          >
            {{ label }}
          </p>
        </div>
      </template>
    </div>

    <figcaption
      v-if="$slots.default"
      class="media__caption"
    >
      <slot />
    </figcaption>
  </figure>
</template>

<style scoped>
.media {
  margin-block: var(--spacing-phi-6);
}

/* Breaking out of the reading column, symmetrically, without knowing how wide
   the column is. Capped so it cannot escape a narrow viewport. */
.media[data-width='wide'] {
  width: min(100vw - 3rem, 64rem);
  margin-inline: calc(50% - min(50vw - 1.5rem, 32rem));
}

.media__frame {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
}

.media__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.media__hatch {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--ui-border);
  opacity: 0.7;
}

.media__note {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 1.5rem;
  text-align: center;
}

.media__icon {
  width: 1.75rem;
  height: 1.75rem;
  color: var(--color-guide-600);
}

.media__kind {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.media__label {
  max-width: 34ch;
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--ui-text-muted);
}

.media__caption {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ui-text-dimmed);
}
</style>
