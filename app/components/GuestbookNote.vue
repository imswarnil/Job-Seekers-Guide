<script setup lang="ts">
/**
 * One note on the guestbook wall: a small paper card with a faint tint, a
 * tiny fixed rotation (deterministic from the id, so the wall never
 * reshuffles), the message, the GIF, the "learned here" line, and who signed
 * it. A tipped note carries its amount as a small badge. Hairline borders,
 * square corners, one 1px offset rule for the paper edge; still Swiss, just
 * pinned to a board.
 */
export interface GuestbookEntry {
  id: number
  name: string
  image: string | null
  message: string
  gif: string | null
  learned: string | null
  amount?: number | null
  createdAt: string
  sample?: boolean
}

const props = defineProps<{ entry: GuestbookEntry }>()

/** ±1.5deg, decided by the id alone: the same note always leans the same way. */
const rotation = computed(() => {
  const hash = (props.entry.id * 137 + 29) % 300
  return ((hash - 150) / 100).toFixed(2)
})

/** One of three faint paper tints, also from the id. */
const tint = computed(() => props.entry.id % 3)
</script>

<template>
  <article
    class="note"
    :data-tint="tint"
    :style="{ '--note-tilt': `${rotation}deg` }"
  >
    <p class="note__meta">
      <UAvatar
        :src="entry.image || undefined"
        :alt="entry.name"
        size="2xs"
      />
      <span class="note__name">{{ entry.name }}</span>
      <span
        v-if="entry.sample"
        class="note__flag"
      >Sample</span>
      <span
        v-if="entry.amount"
        class="note__flag note__flag--tip num"
      >{{ formatPaise(entry.amount) }} tip</span>
    </p>

    <p class="note__message">
      {{ entry.message }}
    </p>

    <img
      v-if="entry.gif"
      :src="entry.gif"
      alt=""
      loading="lazy"
      referrerpolicy="no-referrer"
      class="note__gif"
    >

    <p
      v-if="entry.learned"
      class="note__learned"
    >
      <span class="note__learned-label">Learned here</span>
      {{ entry.learned }}
    </p>

    <p class="note__date num">
      {{ formatAgo(entry.createdAt) }}
    </p>
  </article>
</template>

<style scoped>
.note {
  display: grid;
  gap: 0.625rem;
  padding: 1rem;
  background: var(--note-paper);
  border: 1px solid var(--rule-color, var(--ui-border));
  /* The paper's edge: a 1px offset rule, not a shadow. */
  box-shadow: 1px 1px 0 0 var(--rule-color, var(--ui-border));
  transform: rotate(var(--note-tilt, 0deg));
  overflow-wrap: anywhere;
}

/* Three faint paper tints, readable in both modes. */
.note[data-tint='0'] {
  --note-paper: color-mix(in srgb, #f5b700 4%, var(--ui-bg));
}

.note[data-tint='1'] {
  --note-paper: color-mix(in srgb, var(--ui-primary) 3%, var(--ui-bg));
}

.note[data-tint='2'] {
  --note-paper: color-mix(in srgb, #1d4ed8 3%, var(--ui-bg));
}

@media (prefers-reduced-motion: reduce) {
  .note {
    transform: none;
  }
}

.note__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 0.5rem;
  font-size: 0.8125rem;
}

.note__name {
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.note__flag {
  padding: 0.0625rem 0.3125rem;
  border: 1px solid var(--ui-border-accented);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-muted);
}

.note__flag--tip {
  border-color: var(--ui-primary);
  color: var(--ui-primary);
}

.note__message {
  font-size: 0.9375rem;
  white-space: pre-line;
}

.note__gif {
  max-height: 13rem;
  max-width: 100%;
  border: 1px solid var(--rule-color, var(--ui-border));
  justify-self: start;
}

.note__learned {
  padding-left: 0.75rem;
  border-left: 2px solid var(--ui-primary);
  font-size: 0.875rem;
  white-space: pre-line;
}

.note__learned-label {
  display: block;
  margin-bottom: 0.125rem;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.note__date {
  font-size: 0.75rem;
  color: var(--ui-text-dimmed);
}
</style>
