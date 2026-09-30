import { z } from 'zod'

const schema = z.object({
  kind: z.enum(REACTION_KINDS, 'must be like, love, learned, funny or thanks'),
  // true adds it, false takes it back; left out, it toggles. The page sends the
  // state it wants, so two quick presses cannot cross over each other.
  on: z.boolean().optional()
})

/**
 * React to a lesson comment. Signed in; one reaction of each kind per person
 * per comment. Returns the comment's counts and the caller's reactions after
 * the change: `{ counts, mine }`.
 */
export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'id') || ''
  const id = /^\d{1,15}$/.test(raw) ? Number(raw) : 0
  if (!id) {
    throw createError({ statusCode: 404, statusMessage: 'No such comment' })
  }
  const user = await requireUser(event)
  const sql = requireDb(event)
  const { kind, on } = await readValid(event, schema)
  await rateLimit(event, sql, `react:${user.id}`, 120, 3600)

  const [comment] = await q(sql, 'select 1 from comments where id = $1', [id])
  if (!comment) {
    throw createError({ statusCode: 404, statusMessage: 'That comment has gone' })
  }

  const [existing] = await q(sql, 'select 1 from comment_reactions where comment_id = $1 and user_id = $2 and kind = $3', [id, user.id, kind])
  const want = on ?? !existing
  if (want && !existing) {
    await q(sql, `insert into comment_reactions (comment_id, user_id, kind)
      select $1, $2, $3 where exists (select 1 from comments where id = $1)
      on conflict do nothing`, [id, user.id, kind])
  } else if (!want && existing) {
    await q(sql, 'delete from comment_reactions where comment_id = $1 and user_id = $2 and kind = $3', [id, user.id, kind])
  }

  const result = (await reactionsFor(sql, [id], user.id)).get(id)!
  return { counts: result.counts, mine: result.mine }
})
