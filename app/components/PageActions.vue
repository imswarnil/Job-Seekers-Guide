<script setup lang="ts">
import { editUrl } from '~/utils/links'

/**
 * "Edit this page", and where the words came from. Every lesson is a markdown
 * file in a public repository: a reader who spots a mistake can fix it in
 * about ninety seconds, and one who can see the source can check whether they
 * are being sold something.
 */
const props = defineProps<{
  /** Repo-relative path of the file behind this page. */
  file?: string
  updatedAt?: string | Date
}>()

const formatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const updated = computed(() => props.updatedAt ? formatter.format(new Date(props.updatedAt)) : undefined)
</script>

<template>
  <div class="page-actions">
    <p class="label">
      This page
    </p>

    <ul class="row-list mt-3">
      <li v-if="file">
        <a
          :href="editUrl(file)"
          target="_blank"
          rel="noopener"
          class="page-actions__row row-link"
        >
          Edit this page
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-4 shrink-0"
          />
        </a>
      </li>
      <li>
        <a
          :href="`${repoUrl}/issues/new?title=${encodeURIComponent(`Correction: ${$route.path}`)}`"
          target="_blank"
          rel="noopener"
          class="page-actions__row row-link"
        >
          Report a mistake
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-4 shrink-0"
          />
        </a>
      </li>
    </ul>

    <p
      v-if="updated"
      class="text-xs text-dimmed mt-3 num"
    >
      Last updated {{ updated }}
    </p>
  </div>
</template>

<style scoped>
.page-actions__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 0;
  font-size: var(--text-sm);
  color: var(--ui-text-highlighted);
}

.page-actions__row:hover {
  background: transparent;
  color: var(--ui-primary);
}
</style>
