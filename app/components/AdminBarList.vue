<script setup lang="ts">
/**
 * A ranked list with a proportional bar behind each row: top pages, referrers,
 * countries. The bar is the row's share of the largest value, the number on
 * the right is exact, and the optional share column is of the whole.
 */
const props = withDefaults(defineProps<{
  items: { key: string, label: string, value: number, share?: number, to?: string, flag?: string, icon?: string, hint?: string }[]
  valueLabel?: string
  shareLabel?: string
  limit?: number
}>(), {
  valueLabel: 'Views',
  shareLabel: undefined,
  limit: 10
})

const expanded = ref(false)
const shown = computed(() => (expanded.value ? props.items : props.items.slice(0, props.limit)))
const max = computed(() => Math.max(1, ...props.items.map(i => i.value)))
</script>

<template>
  <div>
    <div class="flex justify-end gap-4 px-1 pb-1 text-[11px] uppercase tracking-wider text-dimmed">
      <span>{{ valueLabel }}</span>
      <span
        v-if="shareLabel"
        class="w-12 text-right"
      >{{ shareLabel }}</span>
    </div>
    <ol class="space-y-1">
      <li
        v-for="item in shown"
        :key="item.key"
        class="relative flex items-center gap-4 text-sm"
      >
        <div class="relative min-w-0 flex-1 px-2 py-1">
          <div
            class="absolute inset-y-0 left-0 bg-primary/12"
            :style="{ width: `${(item.value / max) * 100}%` }"
            aria-hidden="true"
          />
          <div class="relative flex items-center gap-2 min-w-0">
            <span
              v-if="item.flag"
              aria-hidden="true"
            >{{ item.flag }}</span>
            <UIcon
              v-else-if="item.icon"
              :name="item.icon"
              class="size-4 text-muted shrink-0"
            />
            <NuxtLink
              v-if="item.to"
              :to="item.to"
              class="truncate hover:text-primary"
              :title="item.label"
            >
              {{ item.label }}
            </NuxtLink>
            <span
              v-else
              class="truncate"
              :title="item.label"
            >{{ item.label }}</span>
            <span
              v-if="item.hint"
              class="text-xs text-dimmed shrink-0"
            >{{ item.hint }}</span>
          </div>
        </div>
        <span class="tabular-nums text-highlighted font-medium">{{ formatCount(item.value) }}</span>
        <span
          v-if="shareLabel"
          class="w-12 text-right tabular-nums text-muted text-xs"
        >{{ formatShare(item.share ?? 0) }}</span>
      </li>
    </ol>
    <UButton
      v-if="items.length > limit"
      size="xs"
      color="neutral"
      variant="link"
      class="mt-2 px-1"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show fewer' : `Show all ${items.length}` }}
    </UButton>
  </div>
</template>
