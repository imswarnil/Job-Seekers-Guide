<script setup lang="ts">
import { trackStyle } from '~/utils/tech'

/**
 * A track's icon on a wash of its own colour. The small mark used in the
 * sidebar, on the home page and beside a track's title, so Java is orange and
 * SQL is teal wherever you meet them.
 */
const props = withDefaults(defineProps<{
  /** The track's URL slug: `java`, `quantitative-aptitude`. */
  slug?: string
  /** Front-matter icon, used only when the slug is not in the registry. */
  icon?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Just the glyph in the track colour, with no tile behind it. */
  bare?: boolean
}>(), {
  size: 'sm'
})

const style = computed(() => trackStyle(props.slug, props.icon))

const tile = {
  xs: 'size-6 rounded-md',
  sm: 'size-8 rounded-lg',
  md: 'size-10 rounded-lg',
  lg: 'size-14 rounded-xl'
}

const glyph = {
  xs: 'size-3.5',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-7'
}
</script>

<template>
  <UIcon
    v-if="bare"
    :name="style.icon"
    class="track-ink shrink-0"
    :class="glyph[size]"
    :style="{ '--track': style.color }"
    aria-hidden="true"
  />
  <span
    v-else
    class="track-tile"
    :class="tile[size]"
    :style="{ '--track': style.color }"
    aria-hidden="true"
  >
    <UIcon
      :name="style.icon"
      :class="glyph[size]"
    />
  </span>
</template>
