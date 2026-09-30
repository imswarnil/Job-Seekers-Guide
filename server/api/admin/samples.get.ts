/** How much sample content is live. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')
  const [row] = await q(sql, `select
    (select count(*) from stories where sample) as stories,
    (select count(*) from guestbook where sample) as guestbook,
    (select count(*) from comments where sample) as comments,
    exists (select 1 from profiles where id = $1) as profile`, [SAMPLE_PROFILE_ID])
  const counts = { stories: num(row?.stories), guestbook: num(row?.guestbook), comments: num(row?.comments) }
  return { ...counts, total: counts.stories + counts.guestbook + counts.comments, profile: Boolean(row?.profile) }
})
