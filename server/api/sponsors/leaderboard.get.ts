interface Row {
  sponsor_key: string
  name: string
  url: string
  image: string | null
  design: unknown
  total: string
  since: string
}

/**
 * Every sponsor there has ever been, ranked by everything they have paid.
 * A sponsor is the signed-in account that paid (or, for a bid whose account was
 * deleted, the link it pointed at). Name, link and image come from their most
 * recent paid bid.
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'public, max-age=60, s-maxage=120')
  return await softRead(event, { items: [] as unknown[] }, async (sql) => {
    const [rows, holders] = await Promise.all([
      q<Row>(sql, `
        with paid as (
          select *, coalesce(user_id, sponsor_url) as sponsor_key from sponsor_bids where status = 'paid'
        ), latest as (
          select distinct on (sponsor_key) sponsor_key, sponsor_name as name, sponsor_url as url, image, design
          from paid order by sponsor_key, paid_at desc
        )
        select l.sponsor_key, l.name, l.url, l.image, l.design, sum(p.amount) as total, min(p.paid_at) as since
        from paid p join latest l using (sponsor_key)
        group by l.sponsor_key, l.name, l.url, l.image, l.design
        order by total desc, since asc
        limit 200`),
      q<{ slot: string, user_id: string | null, url: string }>(sql, HOLDERS_SQL)
    ])

    return {
      items: rows.map((row, index) => ({
        rank: index + 1,
        name: row.name,
        url: row.url,
        image: row.image,
        // Who they are (creator / builder / company), from their latest paid
        // bid's design; older bids read as `company`.
        type: resolveDesign(row.design).type,
        total: num(row.total),
        slots: holders.filter(h => (h.user_id ?? h.url) === row.sponsor_key).map(h => h.slot),
        since: row.since
      }))
    }
  })
})
