import { z } from 'zod'

const schema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.coerce.number().int().positive().optional()
})

/** The guestbook, newest first. `before` is the id to page back from. */
export default defineEventHandler(async (event) => {
  const { limit, before } = queryValid(event, schema)
  setResponseHeader(event, 'cache-control', 'public, max-age=20, s-maxage=30')
  return await softRead(event, { items: [] as unknown[] }, async (sql) => {
    const rows = await q<{ id: string, name: string, message: string, gif: string | null, learned: string | null, amount: number | null, created_at: string, image: string | null, sample: boolean }>(sql, `
      select g.id, g.name, g.message, g.gif, g.learned, g.amount, g.created_at, g.sample, p.image
      from guestbook g left join profiles p on p.id = g.user_id
      where not g.hidden and ($2::bigint is null or g.id < $2)
      order by g.id desc limit $1`, [limit, before ?? null])
    return {
      items: rows.map(r => ({
        id: Number(r.id),
        name: r.name,
        image: r.image,
        message: r.message,
        gif: r.gif && isAllowedGif(r.gif) ? r.gif : null,
        learned: r.learned,
        // A paid tip attached to the note, in paise; null on a plain signing.
        amount: r.amount ? num(r.amount) : null,
        createdAt: r.created_at,
        sample: r.sample
      }))
    }
  })
})
