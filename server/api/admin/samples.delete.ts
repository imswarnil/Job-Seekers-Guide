/**
 * Remove every row marked `sample`, and the "Sample data" profile that owns
 * them, in one transaction with one audit entry. Real content is never
 * touched: the deletes are by the `sample` flag, and the profile is removed
 * only once nothing but sample rows ever pointed at it.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const sql = requireDb(event)
  const [, stories, guestbook, comments] = await sql.transaction([
    sql.query(`delete from story_media where story_id in (select id from stories where sample)`),
    sql.query('delete from stories where sample returning id'),
    sql.query('delete from guestbook where sample returning id'),
    sql.query('delete from comments where sample returning id'),
    sql.query(`delete from profiles p where p.id = $1
      and not exists (select 1 from stories where user_id = p.id)
      and not exists (select 1 from guestbook where user_id = p.id)
      and not exists (select 1 from comments where user_id = p.id)
      and not exists (select 1 from story_votes where user_id = p.id)
      and not exists (select 1 from uploads where user_id = p.id)`, [SAMPLE_PROFILE_ID])
  ]) as [unknown, unknown[], unknown[], unknown[], unknown]
  const removed = { stories: stories.length, guestbook: guestbook.length, comments: comments.length }
  await audit(sql, admin, 'remove-samples', { after: removed })
  return { removed }
})
