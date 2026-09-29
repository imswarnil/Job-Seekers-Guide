<script setup lang="ts">
import type { TocLink } from '@nuxt/content'

/**
 * "On this page", for screens too narrow for the column beside the lesson.
 * Closed by default so it costs one line above the prose, and shut again when
 * a heading is chosen so the reader lands on the text, not on the list.
 */
defineProps<{
  links: TocLink[]
}>()

const open = ref(false)
</script>

<template>
  <nav
    class="toc"
    aria-label="On this page"
  >
    <button
      type="button"
      class="toc__toggle"
      :aria-expanded="open"
      @click="open = !open"
    >
      <UIcon
        name="i-lucide-list"
        class="size-4 text-dimmed shrink-0"
      />
      <span class="flex-1 text-left">On this page</span>
      <UIcon
        name="i-lucide-chevron-down"
        class="size-4 text-dimmed shrink-0 transition-transform"
        :class="open && 'rotate-180'"
      />
    </button>

    <ul
      v-if="open"
      class="toc__list"
    >
      <template
        v-for="link in links"
        :key="link.id"
      >
        <li>
          <a
            :href="`#${link.id}`"
            class="toc__link"
            @click="open = false"
          >{{ link.text }}</a>
        </li>
        <li
          v-for="child in link.children || []"
          :key="child.id"
        >
          <a
            :href="`#${child.id}`"
            class="toc__link toc__link--child"
            @click="open = false"
          >{{ child.text }}</a>
        </li>
      </template>
    </ul>
  </nav>
</template>

<style scoped>
.toc {
  margin-bottom: 2rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-lg);
  background: var(--ui-bg-elevated);
}

.toc__toggle {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.toc__list {
  max-height: 50vh;
  overflow-y: auto;
  padding: 0 0.5rem 0.75rem;
  border-top: 1px solid var(--ui-border);
  padding-top: 0.5rem;
}

.toc__link {
  display: block;
  padding: 0.375rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.toc__link:hover {
  background: var(--ui-bg-accented);
  color: var(--ui-text-highlighted);
}

.toc__link--child {
  padding-left: 1.5rem;
  font-size: 0.8125rem;
}
</style>
