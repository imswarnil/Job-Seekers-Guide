import { z } from 'zod'

const schema = z.object({
  path: sitePath,
  referrer: z.string().max(500).optional().nullable()
})

/** Keep only the host of an outside referrer; a same-site referrer is not a source. */
function referrerHost(value: string | null | undefined, ownHost: string): string | null {
  if (!value) {
    return null
  }
  try {
    const url = new URL(value)
    if (!/^https?:$/.test(url.protocol) || url.host === ownHost) {
      return null
    }
    return url.host.replace(/^www\./, '').slice(0, 120)
  } catch {
    return null
  }
}

/**
 * One page view. No personal data: a random cookie id, the path, the
 * referring site's host and Cloudflare's country code. Never fails the page:
 * with no database it answers 204 and does nothing.
 */
export default defineEventHandler(async (event) => {
  setResponseStatus(event, 204)
  const sql = useDb(event)
  if (!sql) {
    return null
  }

  const { path, referrer } = await readValid(event, schema)
  const ua = getRequestHeader(event, 'user-agent') || ''
  if (/bot|crawl|spider|slurp|preview|headless|lighthouse/i.test(ua)) {
    return null
  }

  const id = visitorId(event, true)!
  const where = country(event)
  const source = referrerHost(referrer, getRequestURL(event).host)

  // A person reading fast turns maybe ten pages a minute; a script does not stop.
  await rateLimit(event, sql, `track:${clientIp(event)}`, 120, 600)

  await afterResponse(event, (async () => {
    // At most one view of the same path per visitor per ten seconds, so a
    // reload storm or a double-fired route change counts once.
    await q(sql, `
      with s as (
        insert into sessions (id, country, views) values ($1, $2, 1)
        on conflict (id) do update set last_seen = now(), views = sessions.views + 1,
          country = coalesce(excluded.country, sessions.country)
        returning id
      )
      insert into page_views (session_id, path, referrer, country)
      select $1, $3, $4, $2 from s
      where not exists (
        select 1 from page_views
        where session_id = $1 and path = $3 and ts > now() - interval '10 seconds'
      )`, [id, where, path, source])
  })())
  return null
})
