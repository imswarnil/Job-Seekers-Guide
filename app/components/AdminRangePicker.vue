<script setup lang="ts">
/** 24 h · 7 d · 30 d · 90 d, as a segmented control. */
const range = defineModel<AdminRange>({ required: true })
</script>

<template>
  <div
    class="inline-flex border border-default"
    role="radiogroup"
    aria-label="Time range"
  >
    <button
      v-for="r in ADMIN_RANGES"
      :key="r.value"
      type="button"
      role="radio"
      :aria-checked="range === r.value"
      :class="[
        'px-3 py-1.5 text-sm tabular-nums transition-colors border-l border-default first:border-l-0',
        range === r.value ? 'bg-inverted text-inverted font-semibold' : 'text-muted hover:text-highlighted hover:bg-elevated'
      ]"
      @click="range = r.value"
    >
      {{ r.label }}
    </button>
  </div>
</template>
