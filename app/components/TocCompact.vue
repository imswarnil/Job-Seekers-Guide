<script setup lang="ts">
import type { TocLink } from '@nuxt/content'

/**
 * "On this page", for screens too narrow for the column beside the lesson.
 * One ruled line above the prose, closed by default, shut again when a
 * heading is chosen so the reader lands on the text, not on the list.
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
      <span class="label flex-1">On this page</span>
      <UIcon
        name="i-lucide-chevron-down"
        class="toc__chevron size-4 shrink-0"
      />
    </button>

    <ol
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
    </ol>
  </nav>
</template>

<style scoped>
.toc {
  margin-bottom: 2.5rem;
  border-block: 1px solid var(--rule-color);
}

.toc__toggle {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 0;
  color: var(--ui-text-muted);
}

.toc__toggle:hover {
  color: var(--ui-text-highlighted);
}

.toc__chevron {
  transition: transform var(--dgm-t-fast) var(--dgm-ease);
}

.toc__toggle[aria-expanded='true'] .toc__chevron {
  transform: rotate(180deg);
}

.toc__list {
  max-height: 50vh;
  overflow-y: auto;
  padding-bottom: 0.5rem;
  border-top: 1px solid var(--rule-color);
}

.toc__link {
  display: block;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--rule-color);
  font-size: 0.9375rem;
  color: var(--ui-text-muted);
}

.toc__link:hover {
  color: var(--ui-text-highlighted);
}

.toc__link--child {
  padding-left: 1.25rem;
  font-size: 0.875rem;
}
</style>
