/**
 * Vote for a story, once per account. Pressing again takes the vote back.
 * The count on `stories` moves in the same statement as the vote row, and
 * only when a row was actually inserted or deleted, so it cannot drift.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const sql = requireDb(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({ statusCode: 404, statusMessage: 'Story not found' })
  }
  await rateLimit(event, sql, `vote:${user.id}`, 60, 3600)

  const [story] = await q<{ status: string }>(sql, 'select status from stories where id = $1', [id])
  if (!story || story.status === 'hidden') {
    throw createError({ statusCode: 404, statusMessage: 'Story not found' })
  }

  const [existing] = await q(sql, 'select 1 from story_votes where story_id = $1 and user_id = $2', [id, user.id])
  // One statement each way: the data-modifying CTE and the count update commit together.
  const [row] = existing
    ? await q<{ votes: number }>(sql, `
        with d as (delete from story_votes where story_id = $1 and user_id = $2 returning 1)
        update stories set votes = greatest(votes - (select count(*) from d), 0) where id = $1 returning votes`, [id, user.id])
    : await q<{ votes: number }>(sql, `
        with i as (insert into story_votes (story_id, user_id) values ($1, $2) on conflict do nothing returning 1)
        update stories set votes = votes + (select count(*) from i) where id = $1 returning votes`, [id, user.id])

  const votes = num(row?.votes)
  return { voted: !existing, votes }
})
