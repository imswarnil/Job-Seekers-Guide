/** `{ slot, holder: null | { name, url, image, tagline, amount }, minimumNextBid }` */
export default defineEventHandler(async (event) => {
  const slot = getRouterParam(event, 'slot') || ''
  if (!isSlot(slot)) {
    throw createError({ statusCode: 404, statusMessage: 'No such sponsor slot' })
  }
  setResponseHeader(event, 'cache-control', 'public, max-age=30, s-maxage=60')

  const holder = await softRead(event, null, async (sql) => {
    const rows = await q<{ name: string, url: string, image: string | null, tagline: string | null, amount: number }>(sql, `
      select sponsor_name as name, sponsor_url as url, image, tagline, amount
      from sponsor_bids where status = 'paid' and slot = $1
      order by amount desc, paid_at asc limit 1`, [slot])
    return rows[0] ? { ...rows[0], amount: num(rows[0].amount) } : null
  })

  return { slot, holder, minimumNextBid: minimumNextBid(slot, holder?.amount) }
})
