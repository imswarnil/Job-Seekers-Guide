<script setup lang="ts">
/**
 * Pick a GIF for a guestbook entry. Searches GIPHY through our server when the
 * site has a GIPHY key; otherwise (or as well) takes a pasted GIPHY or Tenor
 * link. Only those two hosts are accepted, here and again on the server.
 */
const model = defineModel<string | null>({ default: null })

interface Gif { id: string, title: string, preview: string, url: string }

const open = ref(false)
const term = ref('')
const pasted = ref('')
const pasteError = ref('')
const enabled = ref<boolean | null>(null)
const results = ref<Gif[]>([])
const loading = ref(false)

const ALLOWED = [/^(media\d*|i)\.giphy\.com$/, /^(media\d*|c)\.tenor\.com$/]

function allowed(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') {
      return false
    }
    if (ALLOWED.some(h => h.test(url.hostname))) {
      return true
    }
    return /^(www\.)?giphy\.com$/.test(url.hostname) && /\/(gifs|stickers)\//.test(url.pathname)
  } catch {
    return false
  }
}

async function search() {
  loading.value = true
  try {
    const result = await $fetch<{ enabled: boolean, items: Gif[] }>('/api/gifs/search', { query: { q: term.value || undefined } })
    enabled.value = result.enabled
    results.value = result.items
  } catch {
    enabled.value = false
    results.value = []
  } finally {
    loading.value = false
  }
}

const debounced = useDebounceFn(search, 350)
watch(term, () => debounced())
watch(open, (value) => {
  if (value && enabled.value === null) {
    search()
  }
})

function choose(url: string) {
  model.value = url
  open.value = false
}

function usePasted() {
  pasteError.value = ''
  if (!allowed(pasted.value.trim())) {
    pasteError.value = 'Paste a link from giphy.com or tenor.com.'
    return
  }
  choose(pasted.value.trim())
  pasted.value = ''
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <div
      v-if="model"
      class="relative"
    >
      <img
        :src="model"
        alt="The GIF you picked"
        class="h-24 rounded-md"
        referrerpolicy="no-referrer"
      >
      <UButton
        icon="i-lucide-x"
        size="xs"
        color="neutral"
        class="absolute -top-2 -right-2"
        aria-label="Remove the GIF"
        @click="model = null"
      />
    </div>

    <UPopover v-model:open="open">
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-smile-plus"
      >
        {{ model ? 'Change GIF' : 'Add a GIF' }}
      </UButton>

      <template #content>
        <div class="w-80 p-3 space-y-3">
          <template v-if="enabled">
            <UInput
              v-model="term"
              icon="i-lucide-search"
              placeholder="Search GIPHY"
              class="w-full"
              autofocus
            />
            <div class="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto">
              <button
                v-for="g in results"
                :key="g.id"
                type="button"
                class="aspect-square overflow-hidden rounded bg-elevated"
                :title="g.title"
                @click="choose(g.url)"
              >
                <img
                  :src="g.preview"
                  :alt="g.title"
                  loading="lazy"
                  class="h-full w-full object-cover"
                  referrerpolicy="no-referrer"
                >
              </button>
              <p
                v-if="!loading && !results.length"
                class="col-span-3 text-sm text-muted"
              >
                Nothing for that.
              </p>
            </div>
            <p class="text-[0.6875rem] text-dimmed">
              Powered by GIPHY
            </p>
          </template>

          <div class="space-y-2">
            <p
              v-if="enabled === false"
              class="text-sm text-muted"
            >
              Paste the link of a GIF from GIPHY or Tenor.
            </p>
            <div class="flex gap-2">
              <UInput
                v-model="pasted"
                placeholder="https://media.giphy.com/…"
                class="flex-1"
                @keydown.enter.prevent="usePasted"
              />
              <UButton
                color="neutral"
                @click="usePasted"
              >
                Use
              </UButton>
            </div>
            <p
              v-if="pasteError"
              class="text-xs text-error"
            >
              {{ pasteError }}
            </p>
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>
