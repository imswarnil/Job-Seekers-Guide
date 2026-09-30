<script lang="ts">
export type ReactionKind = 'like' | 'love' | 'learned' | 'funny' | 'thanks'

export interface CommentReactionState {
  counts: Record<ReactionKind, number>
  mine: ReactionKind[]
}

export const REACTIONS: { kind: ReactionKind, emoji: string, label: string }[] = [
  { kind: 'like', emoji: '👍', label: 'Liked it' },
  { kind: 'love', emoji: '❤️', label: 'Love it' },
  { kind: 'learned', emoji: '💡', label: 'Learned something' },
  { kind: 'funny', emoji: '😂', label: 'Funny' },
  { kind: 'thanks', emoji: '🙏', label: 'Thank you' }
]

export function emptyReactions(): CommentReactionState {
  return { counts: { like: 0, love: 0, learned: 0, funny: 0, thanks: 0 }, mine: [] }
}
</script>

<script setup lang="ts">
/**
 * The reactions under one lesson comment. Anybody sees the counts; a signed-in
 * reader toggles their own, one of each kind. The change shows at once and is
 * put right from the server's answer, or undone if the request fails.
 *
 * The page sends the state it wants (`on: true | false`), not "toggle", so two
 * quick presses cannot leave the page and the server disagreeing.
 */
const props = defineProps<{
  commentId: number
  /** The page this comment is on, so signing in comes back to it. */
  path: string
}>()

const state = defineModel<CommentReactionState>({ default: () => emptyReactions() })

const { user, ready } = useUser()
const error = ref('')
/** One request per kind at a time; a newer press supersedes an older one. */
const seq: Partial<Record<ReactionKind, number>> = {}

async function toggle(kind: ReactionKind) {
  error.value = ''
  if (!user.value) {
    await navigateTo({ path: '/login', query: { next: `${props.path}#comments-title` } })
    return
  }
  const before: CommentReactionState = { counts: { ...state.value.counts }, mine: [...state.value.mine] }
  const on = !before.mine.includes(kind)

  // Optimistic.
  state.value = {
    counts: { ...before.counts, [kind]: Math.max(0, before.counts[kind] + (on ? 1 : -1)) },
    mine: on ? [...before.mine, kind] : before.mine.filter(k => k !== kind)
  }

  const mark = (seq[kind] = (seq[kind] ?? 0) + 1)
  try {
    const result = await $fetch<CommentReactionState>(`/api/comments/${props.commentId}/react`, {
      method: 'POST',
      body: { kind, on }
    })
    if (seq[kind] === mark) {
      state.value = result
    }
  } catch (e) {
    if (seq[kind] === mark) {
      state.value = before
      error.value = apiError(e, 'That did not save. Try again.')
    }
  }
}

const describe = (r: typeof REACTIONS[number]) => {
  const count = state.value.counts[r.kind] ?? 0
  const mine = state.value.mine.includes(r.kind)
  return `${r.label}: ${count}${mine ? ', including you' : ''}`
}
</script>

<template>
  <div class="reactions">
    <div
      class="reactions__row"
      role="group"
      aria-label="Reactions"
    >
      <button
        v-for="r in REACTIONS"
        :key="r.kind"
        type="button"
        class="reactions__btn"
        :data-empty="!state.counts[r.kind] ? '' : undefined"
        :aria-pressed="user ? state.mine.includes(r.kind) : undefined"
        :aria-label="describe(r)"
        :title="ready && !user ? `${r.label}. Sign in to react` : r.label"
        @click="toggle(r.kind)"
      >
        <span
          aria-hidden="true"
          class="reactions__emoji"
        >{{ r.emoji }}</span>
        <span
          v-if="state.counts[r.kind]"
          class="reactions__count num"
          aria-hidden="true"
        >{{ state.counts[r.kind] }}</span>
      </button>
    </div>
    <p
      v-if="error"
      class="reactions__error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.reactions {
  margin-top: 0.5rem;
}

.reactions__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.reactions__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  min-height: 1.875rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.8125rem;
  color: var(--ui-text-highlighted);
  background: transparent;
  border: 1px solid var(--rule-color, var(--ui-border));
  border-radius: 0;
  cursor: pointer;
  transition: border-color var(--dgm-t-fast, 120ms) var(--dgm-ease, ease);
}

.reactions__btn:hover {
  border-color: var(--ui-text-highlighted);
}

.reactions__btn[data-empty] {
  opacity: 0.55;
}

.reactions__btn[data-empty]:hover,
.reactions__btn[data-empty]:focus-visible {
  opacity: 1;
}

.reactions__btn[aria-pressed='true'] {
  opacity: 1;
  border-color: var(--ui-primary);
  background: color-mix(in oklab, var(--ui-primary) 8%, transparent);
}

.reactions__btn[aria-pressed='true'] .reactions__count {
  color: var(--ui-primary);
}

.reactions__emoji {
  font-size: 0.9375rem;
  line-height: 1;
}

.reactions__count {
  font-weight: 600;
}

.reactions__error {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--ui-error);
}
</style>
