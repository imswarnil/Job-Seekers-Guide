<script lang="ts">
import type { SponsorCardData } from '~/components/SponsorCard.vue'

/** What the sponsor is designing. Name, link, line and logo, plus the three choices. */
export interface SponsorDraft {
  name: string
  url: string
  tagline: string
  image: string
  layout: string
  palette: string
  cta: string | null
}

/** `GET /api/sponsors/design`: the only choices the server accepts. */
export interface SponsorDesignOptions {
  layouts: { id: string, label: string, description: string }[]
  palette: { id: string, label: string, bg: string, ink: string, contrast: number }[]
  ctas: string[]
  limits: { name: number, tagline: number }
}

const WEB = /^https?:\/\/[^\s/$.?#][^\s]*$/i
const MEDIA = /^\/api\/media\/stories\/[\w-]+\/[\w.-]+$/

/**
 * The same checks the server makes, so the sponsor hears about a problem next
 * to the field rather than after pressing Pay. The server checks again.
 */
export function draftProblems(draft: SponsorDraft, options: SponsorDesignOptions | null | undefined): Partial<Record<keyof SponsorDraft, string>> {
  const out: Partial<Record<keyof SponsorDraft, string>> = {}
  const nameMax = options?.limits.name ?? 60
  const taglineMax = options?.limits.tagline ?? 90
  const name = draft.name.trim()
  if (name.length < 2) {
    out.name = 'At least two characters.'
  } else if (name.length > nameMax) {
    out.name = `At most ${nameMax} characters.`
  }
  if (!WEB.test(draft.url.trim())) {
    out.url = 'A full link, starting https://'
  }
  if (draft.tagline.trim().length > taglineMax) {
    out.tagline = `At most ${taglineMax} characters.`
  }
  const image = draft.image.trim()
  if (image && !WEB.test(image) && !MEDIA.test(image)) {
    out.image = 'A full image link, starting https://, or upload a file.'
  }
  if (options && !options.layouts.some(l => l.id === draft.layout)) {
    out.layout = 'Pick a layout.'
  }
  if (options && !options.palette.some(p => p.id === draft.palette)) {
    out.palette = 'Pick a colour.'
  }
  if (options && draft.cta && !options.ctas.includes(draft.cta)) {
    out.cta = 'Pick one of the labels.'
  }
  return out
}
</script>

<script setup lang="ts">
/**
 * The card designer on /sponsor. The sponsor fills in who they are, picks a
 * layout, a colour and a call to action, and sees the card exactly as the
 * site will draw it (the same `SponsorCard`), in both places it appears and in
 * both colour modes, before they pay anything.
 */
const draft = defineModel<SponsorDraft>({ required: true })

const props = defineProps<{
  options: SponsorDesignOptions
  /** Signed in, so a logo file can be uploaded through /api/uploads. */
  canUpload: boolean
  /** Show problems next to the fields (after the first attempt to pay). */
  showProblems?: boolean
}>()

const problems = computed(() => draftProblems(draft.value, props.options))
const problem = (field: keyof SponsorDraft) => (props.showProblems ? problems.value[field] : undefined)

const colour = computed(() => props.options.palette.find(p => p.id === draft.value.palette) ?? props.options.palette[0])

/** The card as it will appear, with placeholders where nothing is typed yet. */
const card = computed<SponsorCardData>(() => {
  const image = draft.value.image.trim()
  return {
    name: draft.value.name.trim() || 'Your name here',
    url: WEB.test(draft.value.url.trim()) ? draft.value.url.trim() : 'https://example.com',
    tagline: draft.value.tagline.trim() || null,
    image: image && (WEB.test(image) || MEDIA.test(image)) ? image : null,
    design: {
      layout: draft.value.layout,
      accent: colour.value?.bg ?? '#111111',
      ink: colour.value?.ink ?? '#FFFFFF',
      cta: draft.value.cta
    }
  }
})

// ---- Logo upload -------------------------------------------------------------
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024
const uploading = ref(false)
const uploadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

async function upload(event: Event) {
  uploadError.value = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  if (!ACCEPT.includes(file.type)) {
    uploadError.value = 'A PNG, JPEG, WebP or GIF image, please.'
    return
  }
  if (file.size > MAX_BYTES) {
    uploadError.value = 'That image is over 5 MB. A logo rarely needs more than 200 KB.'
    return
  }
  uploading.value = true
  try {
    const result = await $fetch<{ kind: string, url: string }>('/api/uploads', {
      method: 'POST',
      body: file,
      headers: { 'content-type': file.type }
    })
    draft.value.image = result.url
  } catch (e) {
    uploadError.value = apiError(e, 'The upload did not go through. Try again, or paste a link instead.')
  } finally {
    uploading.value = false
  }
}

const taglineLeft = computed(() => props.options.limits.tagline - draft.value.tagline.trim().length)
</script>

<template>
  <div class="designer swiss-grid">
    <!-- The fields ------------------------------------------------------------ -->
    <div class="designer__fields col-span-full lg:col-span-5">
      <fieldset class="designer__group">
        <legend class="label">
          01 · Who you are
        </legend>
        <UFormField
          label="Name to show"
          :error="problem('name')"
          required
        >
          <UInput
            v-model="draft.name"
            :maxlength="options.limits.name"
            placeholder="Your company, or you"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Link"
          :error="problem('url')"
          required
        >
          <UInput
            v-model="draft.url"
            type="url"
            placeholder="https://"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="One line"
          :error="problem('tagline')"
        >
          <template #hint>
            <span
              class="num"
              :class="taglineLeft < 0 ? 'text-error' : ''"
            >{{ taglineLeft }} left</span>
          </template>
          <UInput
            v-model="draft.tagline"
            :maxlength="options.limits.tagline"
            placeholder="Hiring Java freshers in Bangalore"
            class="w-full"
          />
        </UFormField>
      </fieldset>

      <fieldset class="designer__group">
        <legend class="label">
          02 · Logo
        </legend>
        <UFormField
          label="Image link"
          hint="Optional"
          :error="problem('image')"
        >
          <UInput
            v-model="draft.image"
            placeholder="https://…/logo.png"
            class="w-full"
          />
        </UFormField>
        <div class="flex flex-wrap items-center gap-3">
          <input
            ref="fileInput"
            type="file"
            :accept="ACCEPT.join(',')"
            class="sr-only"
            tabindex="-1"
            aria-hidden="true"
            @change="upload"
          >
          <UButton
            v-if="canUpload"
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-upload"
            :loading="uploading"
            @click="fileInput?.click()"
          >
            Upload an image
          </UButton>
          <span
            v-else
            class="text-xs text-muted"
          >Sign in to upload a file, or paste a link above.</span>
          <UButton
            v-if="draft.image"
            color="neutral"
            variant="link"
            size="sm"
            @click="draft.image = ''"
          >
            Remove
          </UButton>
          <span class="text-xs text-muted">PNG, JPEG, WebP or GIF, up to 5 MB. A square logo looks best.</span>
        </div>
        <p
          v-if="uploadError"
          class="text-sm text-error"
          role="alert"
        >
          {{ uploadError }}
        </p>
      </fieldset>

      <fieldset class="designer__group">
        <legend class="label">
          03 · Layout
        </legend>
        <div
          class="choices row-list"
          role="radiogroup"
          aria-label="Layout"
        >
          <label
            v-for="l in options.layouts"
            :key="l.id"
            class="choice"
            :data-on="draft.layout === l.id ? '' : undefined"
          >
            <input
              v-model="draft.layout"
              type="radio"
              name="sponsor-layout"
              :value="l.id"
              class="sr-only"
            >
            <span
              class="choice__mark"
              aria-hidden="true"
            />
            <span class="min-w-0">
              <span class="choice__title">{{ l.label }}</span>
              <span class="choice__text">{{ l.description }}</span>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset class="designer__group">
        <legend class="label">
          04 · Colour
        </legend>
        <div
          class="swatches"
          role="radiogroup"
          aria-label="Colour"
        >
          <label
            v-for="p in options.palette"
            :key="p.id"
            class="swatch"
            :data-on="draft.palette === p.id ? '' : undefined"
            :title="`${p.label}, contrast ${p.contrast}:1`"
          >
            <input
              v-model="draft.palette"
              type="radio"
              name="sponsor-palette"
              :value="p.id"
              class="sr-only"
            >
            <span
              class="swatch__chip"
              :style="{ background: p.bg, color: p.ink }"
              aria-hidden="true"
            >Aa</span>
            <span class="swatch__label">{{ p.label }}</span>
          </label>
        </div>
        <p class="text-xs text-muted">
          Every colour is paired with the text colour that stays readable on it
          (at least 4.5 to 1), in light and dark mode alike.
        </p>
      </fieldset>

      <fieldset class="designer__group">
        <legend class="label">
          05 · Button label
        </legend>
        <div class="ctas">
          <button
            type="button"
            class="cta-pick"
            :aria-pressed="!draft.cta"
            @click="draft.cta = null"
          >
            None
          </button>
          <button
            v-for="c in options.ctas"
            :key="c"
            type="button"
            class="cta-pick"
            :aria-pressed="draft.cta === c"
            @click="draft.cta = c"
          >
            {{ c }}
          </button>
        </div>
      </fieldset>
    </div>

    <!-- The previews ------------------------------------------------------------ -->
    <div class="designer__previews col-span-full lg:col-span-7">
      <div class="lg:sticky lg:top-4 space-y-6">
        <div>
          <p class="label mb-2">
            Preview · home page band
          </p>
          <div class="space-y-px">
            <div
              class="stage"
              data-theme="light"
            >
              <span class="stage__tag">Light</span>
              <SponsorCard
                :sponsor="card"
                size="band"
                theme="light"
                preview
              />
            </div>
            <div
              class="stage"
              data-theme="dark"
            >
              <span class="stage__tag">Dark</span>
              <SponsorCard
                :sponsor="card"
                size="band"
                theme="dark"
                preview
              />
            </div>
          </div>
        </div>

        <div>
          <p class="label mb-2">
            Preview · beside every lesson
          </p>
          <div class="grid gap-px sm:grid-cols-2">
            <div
              class="stage stage--column"
              data-theme="light"
            >
              <span class="stage__tag">Light</span>
              <SponsorCard
                :sponsor="card"
                size="column"
                theme="light"
                preview
              />
            </div>
            <div
              class="stage stage--column"
              data-theme="dark"
            >
              <span class="stage__tag">Dark</span>
              <SponsorCard
                :sponsor="card"
                size="column"
                theme="dark"
                preview
              />
            </div>
          </div>
        </div>
        <p class="text-xs text-muted">
          This is the real component the site uses, not a picture of it. The
          link opens in a new tab and is marked as sponsored for search engines.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.designer {
  row-gap: 2rem;
}

.designer__fields {
  display: grid;
  gap: 2rem;
  align-content: start;
}

.designer__group {
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding-top: 0.75rem;
  border-top: 2px solid var(--rule-strong, var(--ui-text-highlighted));
}

.designer__group > legend {
  float: left;
  width: 100%;
  margin-bottom: 0.25rem;
  padding: 0;
}

/* ---- Layout choices: rows between rules, the chosen one marked in red. ---- */
.choice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0;
  cursor: pointer;
}

.choice__mark {
  flex-shrink: 0;
  width: 0.75rem;
  height: 0.75rem;
  margin-top: 0.3rem;
  border: 1px solid var(--ui-text-highlighted);
}

.choice[data-on] .choice__mark {
  background: var(--ui-primary);
  border-color: var(--ui-primary);
}

.choice__title {
  display: block;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.choice__text {
  display: block;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.choice:has(input:focus-visible) {
  outline: 2px solid var(--ui-text-highlighted);
  outline-offset: 2px;
}

/* ---- Swatches -------------------------------------------------------------- */
.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 0.5rem;
}

.swatch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem;
  border: 1px solid var(--rule-color, var(--ui-border));
  cursor: pointer;
}

.swatch[data-on] {
  border-color: var(--ui-text-highlighted);
  background: var(--ui-bg-muted);
}

.swatch[data-on] .swatch__label {
  font-weight: 600;
}

.swatch:has(input:focus-visible) {
  outline: 2px solid var(--ui-text-highlighted);
  outline-offset: 2px;
}

.swatch__chip {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.swatch__label {
  min-width: 0;
  font-size: 0.8125rem;
  color: var(--ui-text-highlighted);
}

/* ---- Call-to-action labels ------------------------------------------------- */
.ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cta-pick {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  border: 1px solid var(--rule-color, var(--ui-border));
  background: transparent;
  cursor: pointer;
}

.cta-pick:hover {
  border-color: var(--ui-text-highlighted);
}

.cta-pick[aria-pressed='true'] {
  color: var(--ui-bg);
  background: var(--ui-text-highlighted);
  border-color: var(--ui-text-highlighted);
}

/* ---- Preview stages: fixed light and dark surfaces with their guide lines. -- */
.stage {
  position: relative;
  padding: 2rem 1.25rem 1.25rem;
  background-color: #ffffff;
  background-image: linear-gradient(to right, #ececec 1px, transparent 1px);
  background-size: calc(100% / 6) 100%;
  outline: 1px solid var(--rule-color, var(--ui-border));
}

.stage[data-theme='dark'] {
  background-color: #0a0a0a;
  background-image: linear-gradient(to right, #1c1c1c 1px, transparent 1px);
}

.stage--column {
  background-size: calc(100% / 3) 100%;
}

.stage__tag {
  position: absolute;
  top: 0.5rem;
  left: 0.75rem;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #737373;
}

.stage--column :deep(.sc) {
  max-width: 18rem;
}
</style>
