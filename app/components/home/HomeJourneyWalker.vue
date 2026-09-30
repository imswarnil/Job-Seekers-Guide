<script setup lang="ts">
/**
 * The walker on the home page's road: you, or me, travelling it.
 *
 * A plain circle in the colour of the stretch of road it is on, with a thin
 * ring a few pixels out. Given an image (`journey.walkerImage` in
 * app.config.ts) it becomes that photo, clipped to a circle, with the colour
 * as its ring instead. Same size and position either way, so swapping one for
 * the other changes nothing around it.
 */
const props = withDefaults(defineProps<{
  /** The colour of the current phase. */
  color: string
  /** A photo to show instead of the plain circle. */
  image?: string
  /** Diameter in pixels. */
  size?: number
  /** Said to screen readers: where the walker is. */
  label?: string
}>(), {
  size: 44
})

const failed = ref(false)
watch(() => props.image, () => {
  failed.value = false
})
</script>

<template>
  <span
    class="walker"
    :data-photo="image && !failed ? '' : undefined"
    :style="{ '--walker': color, '--size': `${size}px` }"
    role="img"
    :aria-label="label || 'You are here'"
  >
    <img
      v-if="image && !failed"
      :src="image"
      alt=""
      class="walker__photo"
      decoding="async"
      @error="failed = true"
    >
  </span>
</template>

<style scoped>
.walker {
  display: block;
  width: var(--size);
  height: var(--size);
  border-radius: 999px;
  background: var(--walker);
  outline: 1px solid var(--walker);
  outline-offset: 4px;
  transition:
    background-color var(--dgm-t-base) var(--dgm-ease),
    outline-color var(--dgm-t-base) var(--dgm-ease),
    border-color var(--dgm-t-base) var(--dgm-ease);
}

/* A photo: clipped to the circle, the phase colour as a ring around it. */
.walker[data-photo] {
  overflow: hidden;
  border: 3px solid var(--walker);
  background: var(--ui-bg);
  outline: 0;
}

.walker__photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
