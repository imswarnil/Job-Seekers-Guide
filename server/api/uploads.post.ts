/**
 * Upload one image or video for a story, as the raw request body with its
 * Content-Type. Stored in R2 under `stories/<user>/<random>.<ext>` and served
 * back through /api/media/*. Returns `{ kind, url }`, ready for the story's
 * `media` array.
 *
 * Images: JPEG, PNG, WebP or GIF, up to 5 MB. Video: MP4, WebM or MOV, up to
 * 50 MB (or paste a YouTube link instead, which costs nothing to host).
 * The declared type is checked against the file's first bytes.
 */
const TYPES: Record<string, { kind: 'image' | 'video', ext: string, max: number }> = {
  'image/jpeg': { kind: 'image', ext: 'jpg', max: 5 * 1024 * 1024 },
  'image/png': { kind: 'image', ext: 'png', max: 5 * 1024 * 1024 },
  'image/webp': { kind: 'image', ext: 'webp', max: 5 * 1024 * 1024 },
  'image/gif': { kind: 'image', ext: 'gif', max: 5 * 1024 * 1024 },
  'video/mp4': { kind: 'video', ext: 'mp4', max: 50 * 1024 * 1024 },
  'video/webm': { kind: 'video', ext: 'webm', max: 50 * 1024 * 1024 },
  'video/quicktime': { kind: 'video', ext: 'mov', max: 50 * 1024 * 1024 }
}

function looksLike(type: string, b: Uint8Array): boolean {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  switch (type) {
    case 'image/jpeg': return b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF
    case 'image/png': return b[0] === 0x89 && ascii(1, 4) === 'PNG'
    case 'image/gif': return ascii(0, 4) === 'GIF8'
    case 'image/webp': return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
    case 'video/webm': return b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3
    case 'video/mp4':
    case 'video/quicktime': return ascii(4, 8) === 'ftyp' || ascii(4, 8) === 'moov' || ascii(4, 8) === 'wide'
    default: return false
  }
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const sql = requireDb(event)
  const bucket = uploadsBucket(event)
  if (!bucket) {
    throw notConfigured('File uploads')
  }

  const type = (getRequestHeader(event, 'content-type') || '').split(';')[0]!.trim().toLowerCase()
  const rule = TYPES[type]
  if (!rule) {
    throw createError({ statusCode: 415, statusMessage: 'Upload a JPEG, PNG, WebP or GIF image, or an MP4, WebM or MOV video' })
  }
  const declared = Number(getRequestHeader(event, 'content-length') || 0)
  if (declared > rule.max) {
    throw createError({ statusCode: 413, statusMessage: `That file is too large. The limit is ${rule.max / 1024 / 1024} MB` })
  }

  await rateLimit(event, sql, `upload:${user.id}`, 20, 24 * 3600)

  const body = await readRawBody(event, false)
  if (!body || body.byteLength === 0) {
    throw createError({ statusCode: 400, statusMessage: 'The file is empty' })
  }
  if (body.byteLength > rule.max) {
    throw createError({ statusCode: 413, statusMessage: `That file is too large. The limit is ${rule.max / 1024 / 1024} MB` })
  }
  const bytes = new Uint8Array(body.buffer, body.byteOffset, body.byteLength)
  if (!looksLike(type, bytes)) {
    throw createError({ statusCode: 415, statusMessage: 'The file does not match its type' })
  }

  const safeUser = user.id.replace(/[^\w-]/g, '').slice(0, 64) || 'user'
  const key = `stories/${safeUser}/${crypto.randomUUID()}.${rule.ext}`
  await bucket.put(key, bytes, { httpMetadata: { contentType: type } })
  await q(sql, 'insert into uploads (key, user_id, kind, size, content_type) values ($1, $2, $3, $4, $5)',
    [key, user.id, rule.kind, bytes.byteLength, type])

  setResponseStatus(event, 201)
  return { kind: rule.kind, url: `/api/media/${key}` }
})
