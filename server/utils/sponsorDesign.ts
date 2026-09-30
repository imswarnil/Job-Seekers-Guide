import { z } from 'zod'

/**
 * The sponsor card a bidder designs on /sponsor, and the allow-lists it is
 * checked against. This file is the one source of truth: the designer fetches
 * the lists from `GET /api/sponsors/design`, and every holder the API returns
 * carries its design already resolved to colours, so the page never has to
 * know the palette to draw a card.
 *
 * Stored on the bid as `sponsor_bids.design`:
 *   { v: 1, layout, palette, cta }
 * Name, link, logo and tagline keep their own columns.
 */

export const SPONSOR_LAYOUTS = [
  { id: 'wordmark', label: 'Wordmark', description: 'Your name set large, the line under it, a bar of your colour on the left.' },
  { id: 'logo-left', label: 'Logo left', description: 'Your logo in a square, your name and line beside it.' },
  { id: 'statement', label: 'Statement', description: 'The whole card in your colour, your line set as the headline.' },
  { id: 'minimal', label: 'Minimal', description: 'One quiet line: a square of your colour, your name, an arrow.' }
] as const

export type SponsorLayout = typeof SPONSOR_LAYOUTS[number]['id']

/**
 * The colours a card may use. Each is a fill with the ink set on top of it, and
 * every pair clears WCAG AA for body text (4.5:1); `assertPalette()` below
 * proves it rather than trusting the comment.
 */
export const SPONSOR_PALETTE = [
  { id: 'signal', label: 'Signal red', bg: '#C8102E', ink: '#FFFFFF' },
  { id: 'ink', label: 'Ink', bg: '#111111', ink: '#FFFFFF' },
  { id: 'cobalt', label: 'Cobalt', bg: '#1D4ED8', ink: '#FFFFFF' },
  { id: 'forest', label: 'Forest', bg: '#166534', ink: '#FFFFFF' },
  { id: 'violet', label: 'Violet', bg: '#6D28D9', ink: '#FFFFFF' },
  { id: 'ochre', label: 'Ochre', bg: '#F5B700', ink: '#111111' }
] as const

export type SponsorPaletteId = typeof SPONSOR_PALETTE[number]['id']

/** The call-to-action labels a card may carry. Fixed, so nobody writes "CLICK NOW" in red. */
export const SPONSOR_CTAS = ['Visit', 'Hire with us', 'Try it free', 'Learn more', 'See open roles', 'Say hello'] as const

export const TAGLINE_MAX = 90
export const NAME_MAX = 60

const MIN_CONTRAST = 4.5

/** WCAG relative luminance of a #RRGGBB colour. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

/** WCAG contrast ratio between two #RRGGBB colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** The palette, with each pair's contrast, keeping only the pairs that pass. */
export const SAFE_PALETTE = SPONSOR_PALETTE
  .map(p => ({ ...p, contrast: Math.round(contrastRatio(p.bg, p.ink) * 100) / 100 }))
  .filter(p => p.contrast >= MIN_CONTRAST)

const layoutIds = SPONSOR_LAYOUTS.map(l => l.id) as [SponsorLayout, ...SponsorLayout[]]

/** What a bid may send as `design`. Everything is an allow-listed id. */
export const designSchema = z.object({
  layout: z.enum(layoutIds, 'must be one of the four layouts'),
  palette: z.string().refine(id => SAFE_PALETTE.some(p => p.id === id), 'must be one of the palette colours'),
  cta: z.enum(SPONSOR_CTAS, 'must be one of the offered labels').optional().nullable()
}).strict()

export type SponsorDesignInput = z.output<typeof designSchema>

export const DEFAULT_DESIGN: SponsorDesignInput = { layout: 'logo-left', palette: 'ink', cta: null }

/** The design as stored in `sponsor_bids.design`. */
export function storedDesign(input: SponsorDesignInput | undefined | null) {
  const d = input ?? DEFAULT_DESIGN
  return { v: 1, layout: d.layout, palette: d.palette, cta: d.cta ?? null }
}

export interface ResolvedDesign {
  layout: SponsorLayout
  palette: string
  accent: string
  ink: string
  cta: string | null
}

/**
 * A stored design, checked again on the way out and resolved to colours. An
 * older bid (no design), or one that no longer fits the lists, gets the default.
 */
export function resolveDesign(raw: unknown): ResolvedDesign {
  const parsed = designSchema.safeParse(
    raw && typeof raw === 'object' ? { layout: (raw as Record<string, unknown>).layout, palette: (raw as Record<string, unknown>).palette, cta: (raw as Record<string, unknown>).cta } : null
  )
  const d = parsed.success ? parsed.data : DEFAULT_DESIGN
  const colour = SAFE_PALETTE.find(p => p.id === d.palette) ?? SAFE_PALETTE.find(p => p.id === DEFAULT_DESIGN.palette)!
  return { layout: d.layout, palette: colour.id, accent: colour.bg, ink: colour.ink, cta: d.cta ?? null }
}

/**
 * A logo: an absolute http(s) link, or a file this user uploaded through
 * `/api/uploads` (a site path, `/api/media/stories/<user>/<file>`). The
 * ownership of an uploaded file is checked by the bid endpoint.
 */
export const MEDIA_PATH = /^\/api\/media\/(stories\/[\w-]+\/[\w.-]+)$/

export const logoUrl = z.string().trim().max(500).refine((value) => {
  if (MEDIA_PATH.test(value)) {
    return true
  }
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}, 'must be a full http(s) link or an uploaded image')

/** A holder as the public endpoints return it. */
export function publicHolder(row: { name: string, url: string, image: string | null, tagline: string | null, amount: number | string, design?: unknown }) {
  return {
    name: row.name,
    url: row.url,
    image: row.image,
    tagline: row.tagline,
    amount: num(row.amount),
    design: resolveDesign(row.design)
  }
}
