/**
 * The choices the card designer on /sponsor offers: layouts, the palette (each
 * colour with its ink and their contrast ratio), the call-to-action labels and
 * the length limits. Static, so cached for an hour. The bid endpoint accepts
 * nothing outside these lists.
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600')
  return {
    layouts: SPONSOR_LAYOUTS,
    palette: SAFE_PALETTE,
    ctas: SPONSOR_CTAS,
    limits: { name: NAME_MAX, tagline: TAGLINE_MAX },
    default: resolveDesign(DEFAULT_DESIGN)
  }
})
