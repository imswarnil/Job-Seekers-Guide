import { z } from 'zod'

const schema = z.object({ path: sitePath })

const COMMENTS_PER_PAGE = 5

/**
 * Comments under one lesson, oldest first, plus how many of their five the
 * viewer has used on this page (0 when signed out). Each carries its reaction
 * counts and the viewer's own reactions (`reactions: { counts, mine }`).
 */
export default defineEventHandler(async (event) => {
  const { path } = queryValid(event, schema)
  const user = await getSessionUser(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')

  return await softRead(event, { items: [] as unknown[], used: 0, limit: COMMENTS_PER_PAGE }, async (sql) => {
    const rows = await q<{ id: string, body: string, gif: string | null, ts: string, user_id: string, name: string | null, image: string | null, sample: boolean }>(sql, `
      select c.id, c.body, c.gif, c.ts, c.user_id, c.sample, p.name, p.image
      from comments c left join profiles p on p.id = c.user_id
      where c.path = $1 order by c.ts asc limit 300`, [path])
    const reactions = await reactionsFor(sql, rows.map(r => Number(r.id)), user?.id ?? null)
    return {
      items: rows.map(r => ({
        id: Number(r.id),
        body: r.body,
        gif: r.gif && isAllowedGif(r.gif) ? r.gif : null,
        createdAt: r.ts,
        author: { name: r.name || 'A reader', image: r.image },
        mine: Boolean(user && r.user_id === user.id),
        sample: r.sample,
        reactions: reactions.get(Number(r.id)) ?? { counts: emptyCounts(), mine: [] }
      })),
      used: user ? rows.filter(r => r.user_id === user.id).length : 0,
      limit: COMMENTS_PER_PAGE
    }
  })
})
