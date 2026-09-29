/** Payments and sponsor bids, read-only. Money in paise. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')

  const [payments, bids, totals] = await Promise.all([
    q<Record<string, unknown>>(sql, `
      select y.id, y.kind, y.amount, y.currency, y.status, y.name, y.message, y.dodo_payment_id,
             y.created_at, p.email
      from payments y left join profiles p on p.id = y.user_id
      order by y.created_at desc limit 500`),
    q<Record<string, unknown>>(sql, `
      select b.id, b.slot, b.sponsor_name, b.sponsor_url, b.image, b.tagline, b.amount, b.status,
             b.created_at, b.paid_at, p.email
      from sponsor_bids b left join profiles p on p.id = b.user_id
      order by b.created_at desc limit 500`),
    q<Record<string, unknown>>(sql, `
      select kind, status, count(*) as n, coalesce(sum(amount), 0) as amount
      from payments group by kind, status order by kind, status`)
  ])

  return {
    payments: payments.map(r => ({ ...r, amount: num(r.amount) })),
    bids: bids.map(r => ({ ...r, id: Number(r.id), amount: num(r.amount) })),
    totals: totals.map(r => ({ kind: r.kind, status: r.status, count: num(r.n), amount: num(r.amount) }))
  }
})
