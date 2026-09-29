import type { H3Event } from 'h3'
import { handleAuthProxyRequest, parseSessionData } from '@neondatabase/auth/server'

/**
 * Neon Auth, through our own origin.
 *
 * The browser never talks to Neon directly. Every auth call goes to
 * `/api/auth/*` on this site (server/api/auth/[...path].ts), which proxies it to
 * the project's Neon Auth endpoint with `@neondatabase/auth/server`. That keeps
 * the session cookies first-party (`__Secure-neon-auth.*` on this domain), so
 * the server can read them on any request, the same way the SDK's own Next.js
 * adapter does.
 */

export interface SessionUser {
  id: string
  email: string
  name: string
  image: string | null
  isAdmin: boolean
}

/**
 * The secret that signs the short-lived `session_data` cookie the proxy mints
 * (HMAC, at least 32 characters). NEON_AUTH_COOKIE_SECRET when set; otherwise
 * derived from NEON_AUTH_SECRET_SERVER_KEY, or failing that from DATABASE_URL,
 * so a project with only the settings Neon hands out still works. The
 * derivation is one-way: the cookie never carries anything that reveals either.
 */
const derived = new Map<string, string>()
async function cookieSecret(event: H3Event): Promise<string | null> {
  const env = useServerEnv(event)
  if (env.NEON_AUTH_COOKIE_SECRET && env.NEON_AUTH_COOKIE_SECRET.length >= 32) {
    return env.NEON_AUTH_COOKIE_SECRET
  }
  // Fallbacks, in order: the Neon Auth server key, then the database URL. Either
  // is already a secret that grants more than this cookie ever could, so a
  // one-way derivation from it adds no exposure and saves a setting.
  const serverKey = env.NEON_AUTH_SECRET_SERVER_KEY || env.DATABASE_URL
  if (!serverKey) {
    return null
  }
  let secret = derived.get(serverKey)
  if (!secret) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`jobseekers-session-data:${serverKey}`))
    secret = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
    derived.set(serverKey, secret)
  }
  return secret
}

export async function authConfig(event: H3Event) {
  const baseUrl = useServerEnv(event).NEON_AUTH_BASE_URL?.replace(/\/+$/, '')
  const secret = baseUrl ? await cookieSecret(event) : null
  if (!baseUrl || !secret) {
    return null
  }
  return {
    baseUrl,
    cookieSecret: secret,
    // Lax, not the SDK's strict default: the OAuth round trip comes back to us
    // as a top-level cross-site navigation, and strict would drop the cookie.
    sameSite: 'lax' as const,
    sessionDataTtl: 300
  }
}

export function isAdminEmail(event: H3Event, email: string | undefined | null) {
  if (!email) {
    return false
  }
  const list = (useServerEnv(event).ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

/** Forward every Set-Cookie on an auth response onto ours, one header each. */
export function forwardSetCookies(event: H3Event, response: Response) {
  for (const cookie of response.headers.getSetCookie()) {
    appendResponseHeader(event, 'set-cookie', cookie)
  }
}

/**
 * Who is making this request, or null. Cached on the event, so calling it twice
 * in one handler costs one lookup. A signed, short-lived `session_data` cookie
 * answers most calls without leaving the Worker; otherwise it asks Neon Auth.
 */
export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const ctx = event.context as { sessionUser?: SessionUser | null }
  if (ctx.sessionUser !== undefined) {
    return ctx.sessionUser
  }
  ctx.sessionUser = null

  // An API client may send the Neon Auth JWT itself (from `authClient.getJWTToken()`
  // or the `set-auth-jwt` header); it is verified against the project's JWKS.
  const bearer = getRequestHeader(event, 'authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const jwksUrl = useServerEnv(event).NEON_AUTH_JWKS_URL
  if (bearer && jwksUrl) {
    const claims = await verifyJwt(bearer, jwksUrl)
    const id = claims?.sub || claims?.id
    if (claims && id && claims.email) {
      ctx.sessionUser = {
        id: String(id),
        email: claims.email,
        name: claims.name || claims.email.split('@')[0] || 'Reader',
        image: claims.image || null,
        isAdmin: isAdminEmail(event, claims.email)
      }
    }
    return ctx.sessionUser
  }

  const config = await authConfig(event)
  const cookie = getRequestHeader(event, 'cookie') || ''
  if (!config || !cookie.includes('neon-auth')) {
    return null
  }

  try {
    const origin = getRequestURL(event).origin
    const request = new Request(`${origin}/api/auth/get-session`, {
      method: 'GET',
      headers: { cookie, origin }
    })
    const response = await handleAuthProxyRequest({ request, path: 'get-session', ...config })
    forwardSetCookies(event, response)
    if (!response.ok) {
      return null
    }
    const data = parseSessionData(await response.json())
    const user = data?.user as { id?: string, email?: string, name?: string, image?: string | null } | null
    if (!data?.session || !user?.id || !user.email) {
      return null
    }
    ctx.sessionUser = {
      id: String(user.id),
      email: user.email,
      name: user.name || user.email.split('@')[0] || 'Reader',
      image: user.image || null,
      isAdmin: isAdminEmail(event, user.email)
    }
  } catch (error) {
    console.error('[auth] session lookup failed:', error instanceof Error ? error.message : 'unknown')
  }
  return ctx.sessionUser
}

/**
 * The signed-in user, mirrored into `profiles` so that what they write can
 * reference them (and cascade away with them). 401 when signed out.
 */
export async function requireUser(event: H3Event): Promise<SessionUser> {
  const user = await getSessionUser(event)
  if (!user) {
    if (!(await authConfig(event))) {
      throw notConfigured('Sign-in')
    }
    throw createError({ statusCode: 401, statusMessage: 'Sign in first' })
  }
  const sql = requireDb(event)
  await q(sql, `insert into profiles (id, email, name, image)
    values ($1, $2, $3, $4)
    on conflict (id) do update set email = excluded.email, name = excluded.name,
      image = excluded.image, last_seen = now()`, [user.id, user.email, user.name, user.image])
  return user
}

export async function requireAdmin(event: H3Event): Promise<SessionUser> {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in first' })
  }
  if (!user.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Admins only' })
  }
  return user
}
