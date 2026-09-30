/**
 * Every slot at once, for /sponsor: its label, the holder (with its design,
 * resolved) and the minimum next bid. (An extension of the contract;
 * `/api/sponsors/slot/:slot` is the single one.)
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'public, max-age=30, s-maxage=60')
  const holders = await softRead(event, [] as { slot: string, name: string, url: string, image: string | null, tagline: string | null, amount: number, design: unknown }[], sql =>
    q(sql, HOLDERS_SQL))

  return {
    items: SLOT_NAMES.map((slot) => {
      const h = holders.find(row => row.slot === slot)
      const holder = h ? publicHolder(h) : null
      return {
        slot,
        label: SLOTS[slot].label,
        floor: SLOTS[slot].floor,
        holder,
        minimumNextBid: minimumNextBid(slot, holder?.amount)
      }
    })
  }
})
