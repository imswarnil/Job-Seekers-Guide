/** Every story, hidden ones included, newest first, for moderation. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')
  const rows = await q<StoryRow & { email: string | null }>(sql, `
    select s.id, s.title, s.from_place, s.to_place, s.company, s.package, s.body, s.status, s.votes,
           s.created_at, s.user_id, s.sample, p.name as author_name, p.image as author_image, p.email
    from stories s left join profiles p on p.id = s.user_id
    order by s.created_at desc limit 500`)
  return {
    items: rows.map(r => ({ ...storyOut(r, []), status: r.status, email: r.email }))
  }
})
