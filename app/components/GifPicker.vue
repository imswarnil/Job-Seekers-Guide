<script setup lang="ts">
/**
 * Pick a GIF for a guestbook entry, by looking at them.
 *
 * With a GIPHY key on the server: a search box over a grid of moving previews,
 * showing what is trending until you type. Click one to pick it. Without a key
 * (`enabled: false`): a plain note saying so, and a box to paste a GIPHY or
 * Tenor link, which is also always there as a fallback. Only those two hosts
 * are accepted, here and again on the server.
 */
const model = defineModel<string | null>({ default: null })

interface Gif { id: string, title: string, preview: string, url: string }

const open = ref(false)
const term = ref('')
const pasted = ref('')
const pasteError = ref('')
const showPaste = ref(false)
const enabled = ref<boolean | null>(null)
const results = ref<Gif[]>([])
const loading = ref(false)
const failed = ref(false)

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

/** Only the newest request may write the grid, however the answers arrive. */
let latest = 0

async function load() {
  const ticket = ++latest
  const q = term.value.trim()
  loading.value = true
  failed.value = false
  try {
    const result = q
      ? await $fetch<{ enabled: boolean, items: Gif[] }>('/api/gifs/search', { query: { q } })
      : await $fetch<{ enabled: boolean, items: Gif[] }>('/api/gifs/trending')
    if (ticket !== latest) {
      return
    }
    enabled.value = result.enabled
    results.value = result.items
  } catch {
    if (ticket !== latest) {
      return
    }
    // A failed request is not the same as GIPHY being switched off: keep the
    // search box, say what happened, and leave the paste box as the way out.
    failed.value = true
    enabled.value ??= false
    results.value = []
  } finally {
    if (ticket === latest) {
      loading.value = false
    }
  }
}

const debounced = useDebounceFn(load, 350)
watch(term, () => debounced())
watch(open, (value) => {
  if (value && enabled.value === null) {
    load()
  }
})

function choose(url: string) {
  model.value = url
  open.value = false
}

function usePasted() {
  pasteError.value = ''
  const value = pasted.value.trim()
  if (!allowed(value)) {
    pasteError.value = 'Paste a link from giphy.com or tenor.com.'
    return
  }
  choose(value)
  pasted.value = ''
}
</script>

<template>
  <div class="gif">
    <div class="flex flex-wrap items-end gap-3">
      <div
        v-if="model"
        class="gif__chosen"
      >
        <img
          :src="model"
          alt="The GIF you picked"
          referrerpolicy="no-referrer"
        >
        <UButton
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          class="gif__remove"
          aria-label="Remove the GIF"
          @click="model = null"
        />
      </div>

      <UButton
        color="neutral"
        variant="outline"
        :icon="open ? 'i-lucide-chevron-up' : 'i-lucide-smile-plus'"
        :aria-expanded="open"
        aria-controls="gif-panel"
        @click="open = !open"
      >
        {{ open ? 'Close' : model ? 'Change the GIF' : 'Add a GIF' }}
      </UButton>
    </div>

    <div
      v-if="open"
      id="gif-panel"
      class="gif__panel"
    >
      <!-- Search, when the site has GIPHY. -->
      <template v-if="enabled !== false">
        <UInput
          v-model="term"
          icon="i-lucide-search"
          placeholder="Search GIPHY: thank you, celebrate, coffee…"
          class="w-full"
          :loading="loading"
          autofocus
          aria-label="Search for a GIF"
        />

        <p class="gif__caption">
          {{ term.trim() ? `Results for "${term.trim()}"` : 'Trending on GIPHY' }}
        </p>

        <div
          class="gif__grid"
          role="listbox"
          aria-label="GIFs"
        >
          <template v-if="loading && !results.length">
            <USkeleton
              v-for="i in 12"
              :key="i"
              class="gif__cell"
            />
          </template>
          <button
            v-for="g in results"
            :key="g.id"
            type="button"
            role="option"
            class="gif__cell gif__option"
            :aria-selected="model === g.url"
            :title="g.title"
            @click="choose(g.url)"
          >
            <img
              :src="g.preview"
              :alt="g.title"
              loading="lazy"
              referrerpolicy="no-referrer"
            >
          </button>
        </div>

        <p
          v-if="failed"
          class="text-sm text-muted"
        >
          GIPHY did not answer. Try again, or paste a link below.
        </p>
        <p
          v-else-if="!loading && enabled && !results.length"
          class="text-sm text-muted"
        >
          Nothing for that. Try a shorter word.
        </p>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            class="text-sm text-muted underline underline-offset-4 hover:text-highlighted"
            @click="showPaste = !showPaste"
          >
            {{ showPaste ? 'Hide the link box' : 'Or paste a link' }}
          </button>
          <span class="gif__powered">Powered by GIPHY</span>
        </div>
      </template>

      <!-- No GIPHY on this site: say so plainly. -->
      <UAlert
        v-else
        color="neutral"
        variant="subtle"
        icon="i-lucide-info"
        title="GIF search is not switched on here yet"
        description="You can still add one: find a GIF on giphy.com or tenor.com, copy its link, and paste it below."
      />

      <div
        v-if="enabled === false || showPaste"
        class="space-y-2"
      >
        <div class="flex gap-2">
          <UInput
            v-model="pasted"
            placeholder="https://media.giphy.com/…"
            class="flex-1"
            aria-label="A GIF link from GIPHY or Tenor"
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
          class="text-sm text-error"
        >
          {{ pasteError }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gif__chosen {
  position: relative;
  display: inline-flex;
}

.gif__chosen img {
  height: 7rem;
  max-width: 14rem;
  object-fit: cover;
  border: 1px solid var(--ui-border);
}

.gif__remove {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
}

.gif__panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.875rem;
  border: 1px solid var(--ui-border);
  background: var(--ui-bg-elevated);
}

.gif__caption {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.gif__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.375rem;
  max-height: 20rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

@media (min-width: 640px) {
  .gif__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.gif__cell {
  aspect-ratio: 1;
  width: 100%;
  height: auto;
}

.gif__option {
  overflow: hidden;
  border: 2px solid transparent;
  background: var(--ui-bg-accented);
  transition: border-color var(--dgm-t-fast) var(--dgm-ease), transform var(--dgm-t-fast) var(--dgm-ease);
}

.gif__option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gif__option:hover,
.gif__option:focus-visible {
  border-color: var(--ui-primary);
}

.gif__option[aria-selected='true'] {
  border-color: var(--ui-primary);
  outline: 2px solid var(--ui-primary);
  outline-offset: 1px;
}

.gif__powered {
  font-size: var(--text-xs);
  color: var(--ui-text-dimmed);
}
</style>
