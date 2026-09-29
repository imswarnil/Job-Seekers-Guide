import { handleAuthProxyRequest } from '@neondatabase/auth/server'

/**
 * `/api/auth/*` → the project's Neon Auth endpoint (Better Auth API).
 *
 * The SDK does the work: header allow-listing, cookie rewriting onto this
 * domain, the signed session-data cache and the OAuth verifier exchange. This
 * file only turns the h3 event into a Fetch Request and back.
 */
export default defineEventHandler(async (event) => {
  const config = await authConfig(event)
  if (!config) {
    throw notConfigured('Sign-in')
  }
  const path = (getRouterParam(event, 'path') || '').replace(/^\/+/, '')
  if (!/^[a-z0-9\-/]+$/i.test(path)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown auth endpoint' })
  }

  const request = toWebRequest(event)
  const response = await handleAuthProxyRequest({ request, path, ...config })

  setResponseStatus(event, response.status, response.statusText)
  // The body below is already decoded by fetch, so the upstream's encoding and
  // length no longer describe it.
  const skip = new Set(['set-cookie', 'content-encoding', 'content-length', 'transfer-encoding'])
  for (const [name, value] of response.headers) {
    if (!skip.has(name.toLowerCase())) {
      setResponseHeader(event, name, value)
    }
  }
  forwardSetCookies(event, response)
  setResponseHeader(event, 'cache-control', 'no-store')
  return response.body ? new Uint8Array(await response.arrayBuffer()) : null
})
