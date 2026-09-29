/**
 * The status of one of our payments, for the thank-you page. Only the status,
 * kind and amount: the reference is an unguessable UUID, and nothing personal
 * is returned. The page polls this until the webhook has landed.
 */
export default defineEventHandler(async (event) => {
  const ref = getRouterParam(event, 'ref') || ''
  if (!/^[0-9a-f-]{36}$/i.test(ref)) {
    throw createError({ statusCode: 404, statusMessage: 'No such payment' })
  }
  setResponseHeader(event, 'cache-control', 'no-store')
  const row = await softRead(event, null, async (sql) => {
    const rows = await q<{ status: string, kind: string, amount: number, slot: string | null }>(sql, `
      select p.status, p.kind, p.amount, b.slot
      from payments p left join sponsor_bids b on b.payment_id = p.id
      where p.id = $1`, [ref])
    return rows[0] ?? null
  })
  if (!row) {
    return { status: 'unknown' }
  }
  return { status: row.status, kind: row.kind, amount: num(row.amount), slot: row.slot }
})
