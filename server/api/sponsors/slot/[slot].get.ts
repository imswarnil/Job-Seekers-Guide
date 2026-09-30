/**
 * `{ slot, holder: null | { name, url, image, tagline, amount, design }, minimumNextBid }`
 *
 * `design` is always present on a holder, resolved to colours (see
 * server/utils/sponsorDesign.ts); a bid placed before designs existed gets the
 * default card.
 */
export default defineEventHandler(async (event) => {
  const slot = resolveSlot(getRouterParam(event, 'slot') || '')
  if (!slot) {
    throw createError({ statusCode: 404, statusMessage: 'No such sponsor slot' })
  }
  setResponseHeader(event, 'cache-control', 'public, max-age=30, s-maxage=60')

  const holder = await softRead(event, null, async (sql) => {
    const rows = await q<{ name: string, url: string, image: string | null, tagline: string | null, amount: number, design: unknown }>(sql, `
      select sponsor_name as name, sponsor_url as url, image, tagline, amount, design
      from sponsor_bids where status = 'paid' and slot = $1
      order by amount desc, paid_at asc limit 1`, [slot])
    return rows[0] ? publicHolder(rows[0]) : null
  })

  return { slot, holder, minimumNextBid: minimumNextBid(slot, holder?.amount) }
})
