/**
 * The Live tab, polled every ten seconds: who is on the site now (a session
 * seen in the last five minutes), where they are and which page they are on,
 * the latest page views, and views per minute for the last half hour.
 * Session ids never leave the server; each visitor gets a short opaque label.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')

  const empty = {
    at: new Date().toISOString(),
    online: 0,
    visitors: [] as { label: string, country: string | null, device: string | null, path: string | null, views: number, firstSeen: string, lastSeen: string }[],
    pages: [] as { path: string, visitors: number }[],
    countries: [] as { country: string, visitors: number }[],
    feed: [] as { id: number, path: string, country: string | null, referrer: string | null, device: string | null, label: string | null, ts: string }[],
    perMinute: [] as { t: string, views: number }[]
  }

  return await softRead(event, empty, async (sql) => {
    const [visitors, feed, perMinute] = await Promise.all([
      q<{ label: string, country: string | null, device: string | null, path: string | null, views: string, first_seen: string, last_seen: string }>(sql, `
        select left(md5(s.id), 6) as label, s.country, s.device, s.views, s.first_seen, s.last_seen,
          (select path from page_views p where p.session_id = s.id order by ts desc limit 1) as path
        from sessions s where s.last_seen > now() - interval '5 minutes'
        order by s.last_seen desc limit 200`),
      q<{ id: string, path: string, country: string | null, referrer: string | null, device: string | null, label: string | null, ts: string }>(sql, `
        select p.id, p.path, p.country, p.referrer, s.device, left(md5(p.session_id), 6) as label, p.ts
        from page_views p left join sessions s on s.id = p.session_id
        order by p.ts desc limit 40`),
      q<{ t: string, views: string }>(sql, `
        select to_char(m.t, 'YYYY-MM-DD"T"HH24:MI:00"Z"') as t, coalesce(v.views, 0) as views
        from generate_series(date_trunc('minute', now()) - interval '29 minutes', date_trunc('minute', now()), interval '1 minute') as m(t)
        left join (select date_trunc('minute', ts) as t, count(*) as views from page_views
                   where ts > now() - interval '31 minutes' group by 1) v using (t)
        order by m.t`)
    ])

    const tally = (key: (v: typeof visitors[number]) => string) => {
      const map = new Map<string, number>()
      for (const v of visitors) {
        map.set(key(v), (map.get(key(v)) ?? 0) + 1)
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1])
    }

    return {
      at: new Date().toISOString(),
      online: visitors.length,
      visitors: visitors.map(v => ({
        label: v.label,
        country: v.country,
        device: v.device,
        path: v.path,
        views: num(v.views),
        firstSeen: v.first_seen,
        lastSeen: v.last_seen
      })),
      pages: tally(v => v.path || '(unknown)').map(([path, n]) => ({ path, visitors: n })),
      countries: tally(v => v.country || '??').map(([country, n]) => ({ country, visitors: n })),
      feed: feed.map(r => ({ id: Number(r.id), path: r.path, country: r.country, referrer: r.referrer, device: r.device, label: r.label, ts: r.ts })),
      perMinute: perMinute.map(r => ({ t: r.t, views: num(r.views) }))
    }
  })
})
