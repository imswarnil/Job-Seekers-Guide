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
 * `format` is the shape, and there are two, the standard ones an ad comes in:
 * `leaderboard` (a wide, slim strip across the full grid, 728×90 in spirit)
 * and `square` (a compact near-square card for a side column, 300×250 in
 * spirit). Both are drawn from the same design, so a sponsor designs once.
 * `theme` forces light or dark for the designer's side-by-side previews;
 * `auto` follows the page.
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
  format?: 'leaderboard' | 'square'
  theme?: 'auto' | 'light' | 'dark'
  /** A preview: drawn exactly the same, but not a link. */
  preview?: boolean
}>(), {
  format: 'square',
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
    :data-format="format"
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
        v-if="sponsor.tagline"
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
      <span class="sc__cta">
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
      </span>
      <span
        v-if="sponsor.tagline"
        class="sc__tagline"
      >{{ sponsor.tagline }}</span>
      <span
        v-if="cta"
        class="sc__cta sc__cta--go"
      >
        <span>{{ cta }}</span>
        <UIcon
          name="i-lucide-arrow-right"
          class="size-4"
        />
      </span>
      <UIcon
        v-else
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

/* ---- The two shapes ---------------------------------------------------------
   A leaderboard is a strip: 90px tall at least, as wide as the grid. A square
   is 6:5 and never wider than 300px. Both grow rather than clip when a
   sponsor's words need the room. */
.sc[data-format='leaderboard'] {
  align-items: center;
  min-height: 5.625rem;
  padding: 0.75rem 1.25rem;
}

.sc[data-format='square'] {
  max-width: 18.75rem;
  aspect-ratio: 6 / 5;
}

/* ---- Logo left ------------------------------------------------------------- */
.sc[data-layout='logo-left'] {
  display: grid;
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

/* Square: the logo and the name share the top row, the line runs under them
   and the button sits on the floor of the card. */
.sc[data-layout='logo-left'][data-format='square'] {
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto auto 1fr;
  gap: 0.75rem;
  align-items: start;
}

.sc[data-layout='logo-left'][data-format='square'] .sc__body {
  align-self: center;
}

.sc[data-layout='logo-left'][data-format='square'] .sc__name {
  font-size: 1.125rem;
}

.sc[data-layout='logo-left'][data-format='square'] .sc__tagline {
  grid-column: 1 / -1;
  grid-row: 2;
  margin-top: 0;
}

.sc[data-layout='logo-left'][data-format='square'] .sc__cta--go {
  grid-column: 1 / -1;
  grid-row: 3;
  align-self: end;
  justify-self: start;
}

.sc[data-layout='logo-left'][data-format='square'] .sc__corner {
  grid-column: 1 / -1;
  grid-row: 3;
  align-self: end;
  justify-self: end;
}

/* Leaderboard: logo, words, button, left to right on one line. */
.sc[data-layout='logo-left'][data-format='leaderboard'] {
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  column-gap: 1rem;
  row-gap: 0;
  align-content: center;
}

.sc[data-layout='logo-left'][data-format='leaderboard'] .sc__logo {
  grid-row: 1 / span 2;
  width: 3.75rem;
  height: 3.75rem;
}

.sc[data-layout='logo-left'][data-format='leaderboard'] .sc__logo[data-fallback] {
  font-size: 1.5rem;
}

.sc[data-layout='logo-left'][data-format='leaderboard'] .sc__body {
  grid-column: 2;
  grid-row: 1;
  gap: 0.125rem;
}

.sc[data-layout='logo-left'][data-format='leaderboard'] .sc__name {
  font-size: 1.1875rem;
}

.sc[data-layout='logo-left'][data-format='leaderboard'] .sc__tagline {
  grid-column: 2;
  grid-row: 2;
  margin-top: 0.125rem;
}

.sc[data-layout='logo-left'][data-format='leaderboard'] .sc__cta--go,
.sc[data-layout='logo-left'][data-format='leaderboard'] .sc__corner {
  grid-column: 3;
  grid-row: 1 / span 2;
}

/* ---- Wordmark -------------------------------------------------------------- */
.sc[data-layout='wordmark'] {
  border-left: 6px solid var(--sc-accent);
}

.sc__wordmark {
  display: block;
  font-size: 1.75rem;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.045em;
  color: var(--sc-fg);
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.sc[data-layout='wordmark'][data-format='square'] {
  flex-direction: column;
}

.sc[data-layout='wordmark'][data-format='square'] .sc__body {
  gap: 0.5rem;
}

.sc[data-layout='wordmark'][data-format='square'] .sc__cta {
  align-self: flex-start;
}

.sc[data-layout='wordmark'][data-format='leaderboard'] {
  justify-content: space-between;
}

.sc[data-layout='wordmark'][data-format='leaderboard'] .sc__body {
  gap: 0.125rem;
}

.sc[data-layout='wordmark'][data-format='leaderboard'] .sc__wordmark {
  font-size: clamp(1.375rem, 0.9rem + 2cqi, 2rem);
}

.sc[data-layout='wordmark'][data-format='leaderboard'] .sc__tagline {
  margin-top: 0.125rem;
}

/* ---- Statement ------------------------------------------------------------- */
.sc[data-layout='statement'] {
  --sc-fg: var(--sc-on-accent);
  --sc-muted: var(--sc-on-accent);

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
  font-size: 1.375rem;
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

.sc[data-layout='statement'][data-format='square'] {
  flex-direction: column;
  gap: 0.75rem;
}

.sc[data-layout='statement'][data-format='square'] .sc__foot {
  margin-top: auto;
}

/* Leaderboard: badge, the line as the headline, then who and where, in a row.
   Too narrow for a row and they stack, which is the square's order. */
.sc[data-layout='statement'][data-format='leaderboard'] {
  flex-flow: row wrap;
  gap: 0.5rem 1.25rem;
}

.sc[data-layout='statement'][data-format='leaderboard'] .sc__top {
  flex: none;
  flex-direction: column;
  gap: 0.375rem;
}

.sc[data-layout='statement'][data-format='leaderboard'] .sc__statement {
  flex: 1 1 14rem;
  font-size: clamp(1.125rem, 0.75rem + 1.8cqi, 1.75rem);
}

.sc[data-layout='statement'][data-format='leaderboard'] .sc__foot {
  flex: 0 1 auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  max-width: 40%;
  padding: 0 0 0 1.25rem;
  border-top: 0;
  border-left: 1px solid var(--sc-on-accent);
}

/* ---- Minimal --------------------------------------------------------------- */
.sc[data-layout='minimal'] {
  border-inline: 0;
}

.sc__square {
  flex-shrink: 0;
  width: 0.75rem;
  height: 0.75rem;
  background: var(--sc-accent);
  outline: 1px solid var(--sc-line);
}

.sc__name--inline,
.sc__tagline--inline {
  min-width: 0;
}

/* Leaderboard: one line between two rules. */
.sc[data-layout='minimal'][data-format='leaderboard'] {
  gap: 0.75rem;
  padding-inline: 0;
}

.sc[data-layout='minimal'][data-format='leaderboard'] .sc__name--inline {
  flex-shrink: 1;
  overflow: hidden;
  font-size: 1.125rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc[data-layout='minimal'][data-format='leaderboard'] .sc__tagline--inline {
  flex: 1;
  margin-top: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc[data-layout='minimal'][data-format='leaderboard'] .sc__cta {
  margin-left: auto;
}

/* Square: the same quiet card, set as a short column between its two rules. */
.sc[data-layout='minimal'][data-format='square'] {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto auto auto 1fr;
  align-items: center;
  gap: 0.5rem 0.625rem;
  padding: 1rem 0;
}

.sc[data-layout='minimal'][data-format='square'] .sc__name--inline {
  grid-column: 1 / -1;
  grid-row: 2;
  font-size: 1.375rem;
}

.sc[data-layout='minimal'][data-format='square'] .sc__tagline--inline {
  grid-column: 1 / -1;
  grid-row: 3;
  margin-top: 0;
}

.sc[data-layout='minimal'][data-format='square'] .sc__cta {
  grid-column: 1 / -1;
  grid-row: 4;
  align-self: end;
  justify-self: start;
}

/* ---- A strip on a narrow screen ----------------------------------------------
   The card is its own container, so these read the strip's width, not the
   window's: a leaderboard on a phone keeps its one line by letting go of the
   least important words first. */
.sc[data-format='leaderboard'] .sc__tagline {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

.sc[data-layout='minimal'][data-format='leaderboard'] .sc__tagline {
  display: block;
}

@container (max-width: 34rem) {
  .sc[data-format='leaderboard'] .sc__tagline {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .sc[data-layout='logo-left'][data-format='leaderboard'] .sc__cta > span,
  .sc[data-layout='wordmark'][data-format='leaderboard'] .sc__cta > span,
  .sc[data-layout='minimal'][data-format='leaderboard'] .sc__cta > span {
    display: none;
  }

  .sc[data-layout='minimal'][data-format='leaderboard'] .sc__tagline {
    display: none;
  }

  .sc[data-layout='statement'][data-format='leaderboard'] .sc__top {
    flex: 1 1 100%;
    flex-direction: row;
  }

  .sc[data-layout='statement'][data-format='leaderboard'] .sc__foot {
    flex: 1 1 100%;
    flex-direction: row;
    align-items: baseline;
    max-width: none;
    padding: 0.5rem 0 0;
    border-left: 0;
    border-top: 1px solid var(--sc-on-accent);
  }
}

@container (max-width: 22rem) {
  .sc[data-layout='minimal'][data-format='leaderboard'] .sc__label {
    display: none;
  }
}
</style>
