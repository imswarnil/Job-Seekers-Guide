/** Every guestbook entry, hidden ones included, for moderation. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')
  const rows = await q<{ id: string, name: string, message: string, gif: string | null, learned: string | null, hidden: boolean, created_at: string, email: string | null }>(sql, `
    select g.id, g.name, g.message, g.gif, g.learned, g.hidden, g.created_at, p.email
    from guestbook g left join profiles p on p.id = g.user_id
    order by g.created_at desc limit 500`)
  return {
    items: rows.map(r => ({
      id: Number(r.id),
      name: r.name,
      message: r.message,
      gif: r.gif,
      learned: r.learned,
      hidden: r.hidden,
      createdAt: r.created_at,
      email: r.email
    }))
  }
})
