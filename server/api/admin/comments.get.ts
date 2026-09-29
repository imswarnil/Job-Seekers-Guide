/** The latest comments across every lesson, for moderation. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')
  const rows = await q<{ id: string, path: string, body: string, ts: string, name: string | null, email: string | null }>(sql, `
    select c.id, c.path, c.body, c.ts, p.name, p.email
    from comments c left join profiles p on p.id = c.user_id
    order by c.ts desc limit 500`)
  return { items: rows.map(r => ({ id: Number(r.id), path: r.path, body: r.body, createdAt: r.ts, name: r.name, email: r.email })) }
})
