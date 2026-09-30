<script setup lang="ts">
/**
 * One number on the dashboard, with its change against the period before.
 * `inverse` is for numbers where down is good; nothing here uses it yet, but a
 * red arrow on a falling error count would be wrong without it.
 */
const props = defineProps<{
  label: string
  value: string
  current?: number
  previous?: number
  icon?: string
  hint?: string
  loading?: boolean
  inverse?: boolean
}>()

const delta = computed(() => (props.current === undefined || props.previous === undefined) ? undefined : change(props.current, props.previous))
const tone = computed(() => {
  const d = delta.value
  if (d === undefined || d === null || d === 0) {
    return 'text-muted'
  }
  const up = d === 'new' || d > 0
  return up !== Boolean(props.inverse) ? 'text-success' : 'text-error'
})
const deltaText = computed(() => {
  const d = delta.value
  if (d === undefined) {
    return ''
  }
  if (d === null) {
    return '±0%'
  }
  if (d === 'new') {
    return 'new'
  }
  return `${d > 0 ? '+' : ''}${formatShare(d)}`
})
</script>

<template>
  <div class="h-full border border-default bg-default p-4 min-w-0">
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs font-medium text-muted truncate">
        {{ label }}
      </p>
      <UIcon
        v-if="icon"
        :name="icon"
        class="size-4 text-dimmed shrink-0"
      />
    </div>
    <USkeleton
      v-if="loading"
      class="mt-2 h-8 w-24"
    />
    <p
      v-else
      class="mt-1 text-2xl font-bold tabular-nums text-highlighted truncate"
    >
      {{ value }}
    </p>
    <p
      v-if="!loading && (deltaText || hint)"
      class="mt-1 text-xs text-muted flex items-center gap-1.5"
    >
      <span
        v-if="deltaText"
        :class="['inline-flex items-center gap-0.5 font-medium tabular-nums whitespace-nowrap', tone]"
      >
        <UIcon
          v-if="typeof delta === 'number' && delta !== 0"
          :name="delta > 0 ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-down-right'"
          class="size-3.5"
        />
        {{ deltaText }}
      </span>
      <span
        v-if="deltaText && previous !== undefined"
        class="truncate"
        title="Compared with the period of the same length before this one"
      >vs prior</span>
      <span
        v-else-if="hint"
        class="truncate"
      >{{ hint }}</span>
    </p>
  </div>
</template>
