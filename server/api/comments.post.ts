import { z } from 'zod'

const schema = z.object({
  path: sitePath,
  body: text(2, 1500)
})

const LIMIT = 5

/**
 * Post a comment under a lesson. Signed in, published straight away, and at
 * most five per person per page, enforced in the insert itself: the count and
 * the insert are one statement, so two quick submissions cannot both slip in
 * as the fifth.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const sql = requireDb(event)
  const { path, body } = await readValid(event, schema)
  await rateLimit(event, sql, `comment:${user.id}`, 20, 3600)

  // Serialise this user's inserts on this page for the length of the statement.
  const [row] = await q<{ id: string, ts: string, used: number }>(sql, `
    with lock as (
      select pg_advisory_xact_lock(hashtext($1 || ':' || $2))
    ), used as (
      select count(*)::int as n from comments, lock where user_id = $1 and path = $2
    ), ins as (
      insert into comments (path, user_id, body)
      select $2, $1, $3 from used where used.n < $4
      returning id, ts
    )
    select ins.id, ins.ts, (select n from used) + 1 as used from ins`, [user.id, path, body, LIMIT])

  if (!row) {
    throw createError({ statusCode: 429, statusMessage: `You have used all ${LIMIT} comments on this page` })
  }

  setResponseStatus(event, 201)
  return {
    comment: {
      id: Number(row.id),
      body,
      createdAt: row.ts,
      author: { name: user.name, image: user.image },
      mine: true,
      sample: false,
      reactions: { counts: emptyCounts(), mine: [] }
    },
    used: num(row.used),
    limit: LIMIT
  }
})
