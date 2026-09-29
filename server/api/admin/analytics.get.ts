import { z } from 'zod'

const schema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30)
})

/** Everything the admin dashboard draws, for the last `days` days. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { days } = queryValid(event, schema)
  setResponseHeader(event, 'cache-control', 'private, no-store')

  const empty = {
    days,
    totals: { visitors: 0, pageViews: 0, liveNow: 0, sessionsInRange: 0, viewsInRange: 0 },
    perDay: [] as { day: string, views: number, sessions: number }[],
    topPages: [] as { path: string, views: number }[],
    countries: [] as { country: string, sessions: number }[],
    referrers: [] as { host: string, views: number }[],
    live: [] as { path: string | null, country: string | null, lastSeen: string }[]
  }

  return await softRead(event, empty, async (sql) => {
    const since = `now() - make_interval(days => $1)`
    const [totals, perDay, topPages, countries, referrers, live] = await Promise.all([
      q(sql, `select
        (select count(*) from sessions) as visitors,
        (select count(*) from page_views) as page_views,
        (select count(*) from sessions where last_seen > now() - interval '5 minutes') as live_now,
        (select count(*) from sessions where last_seen > ${since}) as sessions_in_range,
        (select count(*) from page_views where ts > ${since}) as views_in_range`, [days]),
      q<{ day: string, views: string, sessions: string }>(sql, `
        select to_char(d.day, 'YYYY-MM-DD') as day,
               coalesce(v.views, 0) as views, coalesce(v.sessions, 0) as sessions
        from generate_series(date_trunc('day', now()) - make_interval(days => $1 - 1), date_trunc('day', now()), interval '1 day') as d(day)
        left join (
          select date_trunc('day', ts) as day, count(*) as views, count(distinct session_id) as sessions
          from page_views where ts > ${since} group by 1
        ) v on v.day = d.day
        order by d.day`, [days]),
      q<{ path: string, views: string }>(sql, `
        select path, count(*) as views from page_views where ts > ${since}
        group by path order by views desc limit 25`, [days]),
      q<{ country: string, sessions: string }>(sql, `
        select coalesce(country, '??') as country, count(*) as sessions from sessions
        where last_seen > ${since} group by 1 order by sessions desc limit 50`, [days]),
      q<{ host: string, views: string }>(sql, `
        select referrer as host, count(*) as views from page_views
        where ts > ${since} and referrer is not null group by 1 order by views desc limit 25`, [days]),
      q<{ path: string | null, country: string | null, last_seen: string }>(sql, `
        select s.country, s.last_seen,
          (select path from page_views p where p.session_id = s.id order by ts desc limit 1) as path
        from sessions s where s.last_seen > now() - interval '5 minutes'
        order by s.last_seen desc limit 50`)
    ])
    const t = totals[0] ?? {}
    return {
      days,
      totals: {
        visitors: num(t.visitors),
        pageViews: num(t.page_views),
        liveNow: num(t.live_now),
        sessionsInRange: num(t.sessions_in_range),
        viewsInRange: num(t.views_in_range)
      },
      perDay: perDay.map(r => ({ day: r.day, views: num(r.views), sessions: num(r.sessions) })),
      topPages: topPages.map(r => ({ path: r.path, views: num(r.views) })),
      countries: countries.map(r => ({ country: r.country, sessions: num(r.sessions) })),
      referrers: referrers.map(r => ({ host: r.host, views: num(r.views) })),
      live: live.map(r => ({ path: r.path, country: r.country, lastSeen: r.last_seen }))
    }
  })
})
