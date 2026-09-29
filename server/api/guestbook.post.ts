import { z } from 'zod'

const schema = z.object({
  name: optionalText(60),
  message: text(2, 500),
  gif: z.string().max(500).optional().nullable(),
  learned: optionalText(500)
})

/** Sign the guestbook. Signed in; published straight away; three a day. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const sql = requireDb(event)
  const input = await readValid(event, schema)

  let gif: string | null = null
  if (input.gif) {
    gif = normaliseGif(input.gif)
    if (!gif) {
      throw createError({ statusCode: 400, statusMessage: 'gif: use a GIF link from GIPHY or Tenor' })
    }
  }
  await rateLimit(event, sql, `guestbook:${user.id}`, 3, 24 * 3600)

  const [row] = await q<{ id: string, created_at: string }>(sql, `
    insert into guestbook (user_id, name, message, gif, learned) values ($1, $2, $3, $4, $5)
    returning id, created_at`,
  [user.id, input.name || user.name, input.message, gif, input.learned ?? null])

  setResponseStatus(event, 201)
  return {
    id: Number(row!.id),
    name: input.name || user.name,
    image: user.image,
    message: input.message,
    gif,
    learned: input.learned ?? null,
    createdAt: row!.created_at
  }
})
