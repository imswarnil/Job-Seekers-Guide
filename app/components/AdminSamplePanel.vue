<script setup lang="ts">
/**
 * How much sample content is live, and the one button that removes all of it
 * (stories, guestbook entries and comments marked `sample`, plus the "Sample
 * data" profile). The server does it in one transaction and writes an audit row.
 */
interface Samples { stories: number, guestbook: number, comments: number, total: number, profile: boolean }

const { data, status, error, refresh } = useFetch<Samples>('/api/admin/samples', { server: false, lazy: true })
const open = ref(false)
const busy = ref(false)
const failure = ref('')
const done = ref('')

async function removeAll() {
  busy.value = true
  failure.value = ''
  try {
    const result = await $fetch<{ removed: { stories: number, guestbook: number, comments: number } }>('/api/admin/samples', { method: 'DELETE' })
    const r = result.removed
    done.value = `Removed ${r.stories} stories, ${r.guestbook} guestbook entries and ${r.comments} comments.`
    open.value = false
    await refresh()
  } catch (e) {
    failure.value = apiError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AdminPanel
    title="Sample data"
    description="Fictional content from scripts/seed-samples.mjs. Badged “Sample” on the site and left out of every public count."
    :loading="status === 'pending' && !data"
  >
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="apiError(error)"
    />
    <template v-else-if="data">
      <dl class="grid grid-cols-3 border border-default divide-x divide-default text-center">
        <div class="py-3">
          <dt class="text-xs text-muted">
            Stories
          </dt>
          <dd class="text-xl font-bold tabular-nums text-highlighted">
            {{ data.stories }}
          </dd>
        </div>
        <div class="py-3">
          <dt class="text-xs text-muted">
            Guestbook
          </dt>
          <dd class="text-xl font-bold tabular-nums text-highlighted">
            {{ data.guestbook }}
          </dd>
        </div>
        <div class="py-3">
          <dt class="text-xs text-muted">
            Comments
          </dt>
          <dd class="text-xl font-bold tabular-nums text-highlighted">
            {{ data.comments }}
          </dd>
        </div>
      </dl>
      <p
        v-if="done"
        class="mt-3 text-sm text-success"
      >
        {{ done }}
      </p>
      <p
        v-if="!data.total"
        class="mt-3 text-sm text-muted"
      >
        No sample content is live. To add it again: <code class="text-xs">node --env-file=.env scripts/seed-samples.mjs</code>
      </p>
      <UButton
        v-else
        class="mt-4"
        color="error"
        variant="outline"
        icon="i-lucide-trash-2"
        @click="open = true"
      >
        Remove all sample data
      </UButton>
    </template>

    <UModal
      v-model:open="open"
      title="Remove all sample data?"
      :description="data ? `${data.stories} stories, ${data.guestbook} guestbook entries and ${data.comments} comments marked sample, and the “Sample data” profile. Real content is not touched.` : ''"
    >
      <template #footer>
        <div class="flex w-full flex-col gap-2">
          <p
            v-if="failure"
            class="text-sm text-error"
          >
            {{ failure }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="open = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              icon="i-lucide-trash-2"
              :loading="busy"
              @click="removeAll"
            >
              Remove it all
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </AdminPanel>
</template>
