/**
 * Story media out of R2. Keys are random and never reused, so the response is
 * cached for a year. Served as its stored type with sniffing off and a sandbox
 * CSP, so an uploaded file can only ever be shown, never run.
 */
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key') || ''
  if (!/^stories\/[\w-]+\/[\w.-]+$/.test(key)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  const bucket = uploadsBucket(event)
  const object = bucket ? await bucket.get(key) : null
  if (!object) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  setResponseHeaders(event, {
    'content-type': object.httpMetadata?.contentType || 'application/octet-stream',
    'content-length': object.size,
    'etag': object.httpEtag,
    'cache-control': 'public, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
    'content-security-policy': 'default-src \'none\'; sandbox',
    'content-disposition': 'inline'
  })
  return sendStream(event, object.body)
})
