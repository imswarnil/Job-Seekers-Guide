import { z } from 'zod'

const schema = z.object({
  sort: z.enum(['top', 'new']).default('top'),
  limit: z.coerce.number().int().min(1).max(60).default(30),
  offset: z.coerce.number().int().min(0).max(5000).default(0)
})

/**
 * Stories people have shared. `top` is "most inspiring": featured first, then
 * by votes. `new` is newest first. Hidden stories never appear.
 */
export default defineEventHandler(async (event) => {
  const { sort, limit, offset } = queryValid(event, schema)
  setResponseHeader(event, 'cache-control', 'public, max-age=30, s-maxage=60')

  return await softRead(event, { items: [] as ReturnType<typeof storyOut>[], sort }, async (sql) => {
    const order = sort === 'top'
      ? `(s.status = 'featured') desc, s.votes desc, s.created_at desc`
      : 's.created_at desc'
    const rows = await q<StoryRow>(sql, `${STORY_SELECT}
      where s.status <> 'hidden'
      order by ${order}
      limit $1 offset $2`, [limit, offset])
    const media = rows.length
      ? await q<MediaRow>(sql, `select distinct on (story_id) story_id, kind, url from story_media
          where story_id = any($1::bigint[]) order by story_id, position`, [rows.map(r => r.id)])
      : []
    return { items: rows.map(r => storyOut(r, media)), sort }
  })
})
