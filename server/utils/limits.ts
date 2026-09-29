import type { H3Event } from 'h3'

/**
 * A sliding-window limit kept in Postgres, so it holds across every Worker
 * isolate. One row per attempt; the check and the insert are one statement.
 * Old rows are swept now and then by the same call.
 *
 * `key` is something like `comment:<user id>`. Throws 429 when over.
 */
export async function rateLimit(event: H3Event, sql: Sql, key: string, limit: number, windowSeconds: number) {
  const rows = await q<{ allowed: boolean }>(sql, `
    with recent as (
      select count(*)::int as n from rate_events
      where key = $1 and at > now() - make_interval(secs => $3)
    ), ins as (
      insert into rate_events (key)
      select $1 from recent where recent.n < $2
      returning 1
    )
    select exists (select 1 from ins) as allowed`, [key, limit, windowSeconds])

  if (Math.random() < 0.02) {
    await afterResponse(event, q(sql, `delete from rate_events where at < now() - interval '2 days'`))
  }

  if (!rows[0]?.allowed) {
    setResponseHeader(event, 'retry-after', windowSeconds)
    throw createError({ statusCode: 429, statusMessage: 'Too many requests. Give it a few minutes and try again.' })
  }
}

/** The client's IP, as Cloudflare reports it. Used only as a rate-limit key, never stored alone. */
export function clientIp(event: H3Event): string {
  return getRequestHeader(event, 'cf-connecting-ip')
    || getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
}

/** Two-letter country from Cloudflare, or null (local dev, Tor is `T1`, unknown is `XX`). */
export function country(event: H3Event): string | null {
  const value = getRequestHeader(event, 'cf-ipcountry')?.toUpperCase()
  return value && /^[A-Z][A-Z0-9]$/.test(value) && value !== 'XX' ? value : null
}

const VISITOR_COOKIE = 'jsg_sid'

/**
 * The anonymous analytics id: a random value in a first-party cookie, set on
 * the first tracked page view. It identifies a browser, not a person, and is
 * never joined to an account.
 */
export function visitorId(event: H3Event, create = false): string | null {
  const existing = getCookie(event, VISITOR_COOKIE)
  if (existing && /^[a-f0-9-]{36}$/.test(existing)) {
    return existing
  }
  if (!create) {
    return null
  }
  const id = crypto.randomUUID()
  setCookie(event, VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: getRequestURL(event).protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })
  return id
}
