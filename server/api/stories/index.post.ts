import { z } from 'zod'

const mediaSchema = z.object({
  kind: z.enum(['image', 'video', 'youtube']),
  url: z.string().trim().max(500)
})

const schema = z.object({
  title: text(6, 120),
  from: text(2, 120),
  to: text(2, 120),
  company: optionalText(80),
  package: optionalText(40),
  body: text(80, 8000),
  media: z.array(mediaSchema).max(6).default([])
})

/**
 * Share a story. Signed in. Published straight away (visible); an admin can
 * hide or feature it later. Media is either a file this user uploaded through
 * /api/uploads (checked against the `uploads` table, so nobody can attach
 * somebody else's file) or a YouTube link.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const sql = requireDb(event)
  const input = await readValid(event, schema)
  await rateLimit(event, sql, `story:${user.id}`, 3, 24 * 3600)

  const media: { kind: 'image' | 'video' | 'youtube', url: string, key: string | null }[] = []
  for (const item of input.media) {
    if (item.kind === 'youtube') {
      const id = youtubeId(item.url)
      if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'media: that YouTube link does not look like a video' })
      }
      media.push({ kind: 'youtube', url: `https://www.youtube.com/watch?v=${id}`, key: null })
      continue
    }
    const key = item.url.match(/^\/api\/media\/(stories\/[\w-]+\/[\w.-]+)$/)?.[1]
    if (!key) {
      throw createError({ statusCode: 400, statusMessage: 'media: upload the file first' })
    }
    const [owned] = await q(sql, 'select 1 from uploads where key = $1 and user_id = $2 and kind = $3', [key, user.id, item.kind])
    if (!owned) {
      throw createError({ statusCode: 400, statusMessage: 'media: that file is not one of your uploads' })
    }
    media.push({ kind: item.kind, url: item.url, key })
  }

  const [story] = await q<{ id: string }>(sql, `
    insert into stories (user_id, title, from_place, to_place, company, package, body)
    values ($1, $2, $3, $4, $5, $6, $7) returning id`,
  [user.id, input.title, input.from, input.to, input.company ?? null, input.package ?? null, input.body])
  const storyId = Number(story!.id)

  if (media.length) {
    await sql.transaction(media.map((m, position) => sql`
      insert into story_media (story_id, kind, url, r2_key, position)
      values (${storyId}, ${m.kind}, ${m.url}, ${m.key}, ${position})`))
  }

  setResponseStatus(event, 201)
  return { id: storyId }
})
