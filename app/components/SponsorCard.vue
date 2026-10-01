<script setup lang="ts">
/**
 * The sponsor's card, as the site shows it and as the designer on /sponsor
 * previews it: one component, so the preview is the real thing.
 *
 * Everything that varies arrives already checked by the server. `design`
 * carries the layout id and the two colours of the palette entry (the fill and
 * the ink that passes contrast on it), resolved by server/utils/sponsorDesign.ts.
 * Four layouts, all on the Swiss rules: hairlines, square corners, no shadow,
 * an uppercase "Sponsored" label, type doing the hierarchy.
 *
 * `size` is where it sits: `band` (the full-width band on the home page) or
 * `column` (the card beside a lesson). `theme` forces light or dark for the
 * designer's side-by-side previews; `auto` follows the page.
 */
export interface SponsorCardDesign {
  /** Who the sponsor is: `creator`, `builder` or `company` (the default). */
  type?: 'creator' | 'builder' | 'company' | string
  layout: 'wordmark' | 'logo-left' | 'statement' | 'minimal' | string
  accent: string
  ink: string
  cta?: string | null
}

export interface SponsorCardData {
  name: string
  url: string
  tagline?: string | null
  image?: string | null
  design: SponsorCardDesign
}

const props = withDefaults(defineProps<{
  sponsor: SponsorCardData
  size?: 'band' | 'column'
  theme?: 'auto' | 'light' | 'dark'
  /** A preview: drawn exactly the same, but not a link. */
  preview?: boolean
}>(), {
  size: 'column',
  theme: 'auto',
  preview: false
})

const HEX = /^#[0-9a-f]{6}$/i
const accent = computed(() => HEX.test(props.sponsor.design?.accent) ? props.sponsor.design.accent : '#111111')
const ink = computed(() => HEX.test(props.sponsor.design?.ink) ? props.sponsor.design.ink : '#FFFFFF')
const layout = computed(() => {
  const l = props.sponsor.design?.layout
  return l === 'wordmark' || l === 'statement' || l === 'minimal' ? l : 'logo-left'
})

/** Only a web link or one of this site's uploaded files is ever drawn as an image. */
const image = computed(() => {
  const src = props.sponsor.image
  return src && (/^https?:\/\//i.test(src) || /^\/api\/media\/stories\/[\w-]+\/[\w.-]+$/.test(src)) ? src : null
})
const failed = ref(false)
watch(image, () => {
  failed.value = false
})

const initial = computed(() => (props.sponsor.name || '?').trim().slice(0, 1).toUpperCase() || '?')
const cta = computed(() => props.sponsor.design?.cta || null)
const type = computed(() => {
  const t = props.sponsor.design?.type
  return t === 'creator' || t === 'builder' ? t : 'company'
})

/** The badge word: who this is, not just that it paid. */
const badge = computed(() => {
  if (type.value === 'creator') {
    return 'Creator'
  }
  if (type.value === 'builder') {
    return 'Project'
  }
  return cta.value === 'We are hiring' ? 'Hiring' : 'Sponsor'
})
const host = computed(() => {
  try {
    return new URL(props.sponsor.url).host.replace(/^www\./, '')
  } catch {
    return ''
  }
})
</script>

<template>
  <component
    :is="preview ? 'div' : 'a'"
    :href="preview ? undefined : sponsor.url"
    :target="preview ? undefined : '_blank'"
    :rel="preview ? undefined : 'sponsored noopener'"
    :aria-label="preview ? undefined : `Sponsored: ${sponsor.name}${sponsor.tagline ? `. ${sponsor.tagline}` : ''}`"
    class="sc"
    :data-layout="layout"
    :data-size="size"
    :data-theme="theme"
    :data-type="type"
    :style="{ '--sc-accent': accent, '--sc-on-accent': ink }"
  >
    <!-- Minimal: one line between two rules. -->
    <template v-if="layout === 'minimal'">
      <span
        class="sc__square"
        aria-hidden="true"
      />
      <span class="sc__label">{{ badge }}</span>
      <span class="sc__name sc__name--inline">{{ sponsor.name }}</span>
      <span
        v-if="sponsor.tagline && size === 'band'"
        class="sc__tagline sc__tagline--inline"
      >{{ sponsor.tagline }}</span>
      <span class="sc__cta">
        <span v-if="cta">{{ cta }}</span>
        <UIcon
          name="i-lucide-arrow-up-right"
          class="size-4"
        />
      </span>
    </template>

    <!-- Statement: the card in the sponsor's colour, their line as the headline. -->
    <template v-else-if="layout === 'statement'">
      <span class="sc__top">
        <span class="sc__label">{{ badge }}</span>
        <span
          v-if="image && !failed"
          class="sc__chip"
        >
          <img
            :src="image"
            alt=""
            loading="lazy"
            decoding="async"
            @error="failed = true"
          >
        </span>
      </span>
      <span class="sc__statement">{{ sponsor.tagline || sponsor.name }}</span>
      <span class="sc__foot">
        <span class="sc__name">{{ sponsor.name }}</span>
        <span class="sc__cta">
          <span>{{ cta || host }}</span>
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-4"
          />
        </span>
      </span>
    </template>

    <!-- Wordmark: the name as the mark, a bar of colour down the left edge. -->
    <template v-else-if="layout === 'wordmark'">
      <span class="sc__body">
        <span class="sc__label">{{ badge }}</span>
        <span class="sc__wordmark">{{ sponsor.name }}</span>
        <span
          v-if="sponsor.tagline"
          class="sc__tagline"
        >{{ sponsor.tagline }}</span>
      </span>
      <span class="sc__cta sc__cta--end">
        <span>{{ cta || host }}</span>
        <UIcon
          name="i-lucide-arrow-up-right"
          class="size-4"
        />
      </span>
    </template>

    <!-- Logo left: a square logo (or initial on the colour), the words beside it. -->
    <template v-else>
      <span
        class="sc__logo"
        :data-fallback="!image || failed ? '' : undefined"
      >
        <img
          v-if="image && !failed"
          :src="image"
          alt=""
          loading="lazy"
          decoding="async"
          @error="failed = true"
        >
        <span
          v-else
          aria-hidden="true"
        >{{ initial }}</span>
      </span>
      <span class="sc__body">
        <span class="sc__label">{{ badge }}</span>
        <span class="sc__name">{{ sponsor.name }}</span>
        <span
          v-if="sponsor.tagline"
          class="sc__tagline"
        >{{ sponsor.tagline }}</span>
        <span
          v-if="cta"
          class="sc__cta sc__cta--below"
        >
          <span>{{ cta }}</span>
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </span>
      </span>
      <UIcon
        v-if="!cta"
        name="i-lucide-arrow-up-right"
        class="sc__corner size-4"
      />
    </template>
  </component>
</template>

<style scoped>
/* The surface a card sits on. `auto` reads the page; the two forced themes are
   fixed values so the designer can show both side by side on either page. */
.sc {
  --sc-bg: var(--ui-bg);
  --sc-fg: var(--ui-text-highlighted);
  --sc-muted: var(--ui-text-muted);
  --sc-line: var(--rule-color, var(--ui-border));

  container-type: inline-size;
  position: relative;
  display: flex;
  gap: var(--gutter, 1rem);
  width: 100%;
  min-width: 0;
  padding: 1rem;
  color: var(--sc-fg);
  background: var(--sc-bg);
  border: 1px solid var(--sc-line);
  border-radius: 0;
  text-decoration: none;
  transition: border-color var(--dgm-t-fast, 120ms) var(--dgm-ease, ease);
}

.sc[data-theme='light'] {
  --sc-bg: #ffffff;
  --sc-fg: #0a0a0a;
  --sc-muted: #525252;
  --sc-line: #e5e5e5;
}

.sc[data-theme='dark'] {
  --sc-bg: #0a0a0a;
  --sc-fg: #fafafa;
  --sc-muted: #a3a3a3;
  --sc-line: #2a2a2a;
}

a.sc:hover,
a.sc:focus-visible {
  border-color: var(--sc-fg);
}

a.sc:focus-visible {
  outline: 2px solid var(--sc-fg);
  outline-offset: 2px;
}

.sc__label {
  display: block;
  font-size: 0.6875rem;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sc-muted);
}

/* A quiet per-type accent on the badge: a filled square for a creator, an
   outlined one for a builder, nothing for a company. Swiss, not a sticker. */
.sc[data-type='creator'] .sc__label::before,
.sc[data-type='builder'] .sc__label::before {
  content: '';
  display: inline-block;
  width: 0.5em;
  height: 0.5em;
  margin-right: 0.5em;
  vertical-align: 6%;
  background: var(--sc-accent);
}

.sc[data-type='builder'] .sc__label::before {
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--sc-accent);
}

/* On the statement layout the accent is the background; draw in the ink. */
.sc[data-layout='statement'][data-type='creator'] .sc__label::before {
  background: var(--sc-on-accent);
}

.sc[data-layout='statement'][data-type='builder'] .sc__label::before {
  box-shadow: inset 0 0 0 1px var(--sc-on-accent);
}

.sc__name {
  display: block;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--sc-fg);
  overflow-wrap: anywhere;
}

.sc__tagline {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--sc-muted);
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

.sc__body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.sc__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--sc-fg);
  white-space: nowrap;
}

.sc__cta--below {
  margin-top: 0.5rem;
}

.sc__cta--end {
  align-self: flex-end;
}

/* ---- Logo left ------------------------------------------------------------- */
.sc[data-layout='logo-left'] {
  align-items: flex-start;
  border-top: 3px solid var(--sc-accent);
}

.sc__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  overflow: hidden;
  border: 1px solid var(--sc-line);
  background: var(--sc-bg);
}

.sc__logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.sc__logo[data-fallback] {
  border-color: var(--sc-accent);
  background: var(--sc-accent);
  color: var(--sc-on-accent);
  font-size: 1.25rem;
  font-weight: 700;
}

.sc__corner {
  flex-shrink: 0;
  color: var(--sc-muted);
}

.sc[data-layout='logo-left'][data-size='band'] .sc__logo {
  width: 4.5rem;
  height: 4.5rem;
}

.sc[data-layout='logo-left'][data-size='band'] .sc__logo[data-fallback] {
  font-size: 1.75rem;
}

.sc[data-layout='logo-left'][data-size='band'] .sc__name {
  font-size: 1.375rem;
}

.sc[data-layout='logo-left'][data-size='band'] .sc__tagline {
  font-size: 1rem;
}

/* ---- Wordmark -------------------------------------------------------------- */
.sc[data-layout='wordmark'] {
  flex-direction: column;
  border-left: 6px solid var(--sc-accent);
}

.sc__wordmark {
  display: block;
  font-size: 1.5rem;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.045em;
  color: var(--sc-fg);
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.sc[data-layout='wordmark'][data-size='band'] {
  padding: 1.25rem 1.5rem;
}

.sc[data-layout='wordmark'][data-size='band'] .sc__wordmark {
  font-size: clamp(1.75rem, 1rem + 4cqi, 3rem);
}

/* In the band, the words and the link share a row when there is room and
   stack when there is not. */
.sc[data-layout='wordmark'][data-size='band'] {
  flex-flow: row wrap;
  align-items: flex-end;
  justify-content: space-between;
}

.sc[data-layout='wordmark'][data-size='band'] .sc__body {
  flex: 1 1 18rem;
}

/* ---- Statement ------------------------------------------------------------- */
.sc[data-layout='statement'] {
  --sc-fg: var(--sc-on-accent);
  --sc-muted: var(--sc-on-accent);

  flex-direction: column;
  gap: 0.75rem;
  background: var(--sc-accent);
  border-color: var(--sc-accent);
}

a.sc[data-layout='statement']:hover,
a.sc[data-layout='statement']:focus-visible {
  border-color: var(--sc-accent);
  outline: 2px solid var(--sc-accent);
  outline-offset: 2px;
}

.sc__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.sc__chip {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  padding: 0.125rem;
  background: #ffffff;
}

.sc__chip img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.sc__statement {
  display: block;
  font-size: 1.25rem;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.03em;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

.sc__foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.625rem;
  border-top: 1px solid var(--sc-on-accent);
}

.sc__foot .sc__name {
  font-size: 0.875rem;
  min-width: 0;
}

.sc[data-layout='statement'][data-size='band'] {
  padding: 1.5rem;
}

.sc[data-layout='statement'][data-size='band'] .sc__statement {
  font-size: clamp(1.5rem, 1rem + 3cqi, 2.5rem);
  max-width: 28ch;
}

/* ---- Minimal --------------------------------------------------------------- */
.sc[data-layout='minimal'] {
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-inline: 0;
}

.sc__square {
  flex-shrink: 0;
  width: 0.75rem;
  height: 0.75rem;
  background: var(--sc-accent);
  outline: 1px solid var(--sc-line);
}

.sc__name--inline {
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc__tagline--inline {
  flex: 1;
  min-width: 0;
  margin-top: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc[data-layout='minimal'] .sc__cta {
  margin-left: auto;
}

.sc[data-layout='minimal'][data-size='band'] {
  padding-block: 1rem;
}

.sc[data-layout='minimal'][data-size='band'] .sc__name {
  font-size: 1.125rem;
}

@container (max-width: 22rem) {
  .sc[data-layout='minimal'] .sc__label {
    display: none;
  }
}
</style>
