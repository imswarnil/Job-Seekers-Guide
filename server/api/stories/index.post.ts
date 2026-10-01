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
  // Either the plain body, or the rich one (tiptap JSON, validated strictly
  // by server/utils/richText.ts, which also derives the plain text from it).
  body: text(80, 8000).optional(),
  bodyRich: z.unknown().optional().nullable(),
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

  // The rich body wins when both arrive; the stored plain `body` is always
  // derived from it, so cards and search never disagree with the page.
  let body = input.body ?? ''
  let bodyRich: RichNode | null = null
  if (input.bodyRich !== undefined && input.bodyRich !== null) {
    const validated = validateRichBody(input.bodyRich)
    bodyRich = validated.doc
    body = validated.text
  }
  if (body.length < 80) {
    throw createError({ statusCode: 400, statusMessage: 'body: must be at least 80 characters' })
  }

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
    insert into stories (user_id, title, from_place, to_place, company, package, body, body_rich)
    values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb) returning id`,
  [user.id, input.title, input.from, input.to, input.company ?? null, input.package ?? null, body, bodyRich ? JSON.stringify(bodyRich) : null])
  const storyId = Number(story!.id)

  if (media.length) {
    await sql.transaction(media.map((m, position) => sql`
      insert into story_media (story_id, kind, url, r2_key, position)
      values (${storyId}, ${m.kind}, ${m.url}, ${m.key}, ${position})`))
  }

  setResponseStatus(event, 201)
  return { id: storyId }
})
