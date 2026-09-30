import { z } from 'zod'

/**
 * The ranges the dashboard offers. `unit` and `step` are fixed strings from this
 * table, never from input, so they can sit in SQL text.
 */
const RANGES = {
  '24h': { interval: '24 hours', unit: 'hour', step: '1 hour', buckets: 24 },
  '7d': { interval: '7 days', unit: 'day', step: '1 day', buckets: 7 },
  '30d': { interval: '30 days', unit: 'day', step: '1 day', buckets: 30 },
  '90d': { interval: '90 days', unit: 'day', step: '1 day', buckets: 90 }
} as const
type RangeKey = keyof typeof RANGES

const schema = z.object({
  range: z.enum(['24h', '7d', '30d', '90d']).optional(),
  // The older `?days=` form still works: it picks the nearest range.
  days: z.coerce.number().int().min(1).max(365).optional(),
  tz: z.string().max(64).optional()
})

/** An IANA zone name the runtime recognises, else UTC. */
function zone(tz: string | undefined): string {
  if (!tz || !/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+){0,2}$/.test(tz)) {
    return 'UTC'
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz })
    return tz
  } catch {
    return 'UTC'
  }
}

interface Totals {
  views: number
  visitors: number
  signups: number
  stories: number
  guestbook: number
  comments: number
  payments: number
  money: number
}

const ZERO: Totals = { views: 0, visitors: 0, signups: 0, stories: 0, guestbook: 0, comments: 0, payments: 0, money: 0 }

/**
 * Everything the Traffic, Content and Payments tabs draw for one range, with
 * the same numbers for the period before it. Buckets are hours for 24 h and
 * days otherwise, in the viewer's time zone. Sample content is left out of
 * every count.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const input = queryValid(event, schema)
  const key: RangeKey = input.range
    ?? (input.days === undefined ? '30d' : input.days <= 1 ? '24h' : input.days <= 7 ? '7d' : input.days <= 30 ? '30d' : '90d')
  const range = RANGES[key]
  const tz = zone(input.tz)
  setResponseHeader(event, 'cache-control', 'private, no-store')

  const empty = {
    range: key,
    unit: range.unit,
    tz,
    totals: { current: { ...ZERO }, previous: { ...ZERO } },
    series: [] as { t: string, views: number, visitors: number, signups: number, stories: number, guestbook: number, comments: number, payments: number, money: number }[],
    topPages: [] as { path: string, views: number, visitors: number }[],
    referrers: [] as { host: string, views: number, visitors: number }[],
    countries: [] as { country: string, visitors: number, views: number, share: number }[],
    devices: [] as { device: string, visitors: number, share: number }[],
    signupsSource: 'none' as 'neon_auth' | 'profiles' | 'none'
  }

  return await softRead(event, empty, async (sql) => {
    // $1 interval, $2 zone. `unit` and `step` are from RANGES.
    const cur = `> now() - $1::interval`
    const prev = `> now() - 2 * $1::interval and %s <= now() - $1::interval`
    const between = (col: string) => `${col} ${prev.replace('%s', col)}`
    const bucket = (col: string) => `date_trunc('${range.unit}', ${col} at time zone $2)`

    // Sign-ups: Neon Auth's own table when it is readable, else first writes.
    let signups: { table: string, col: string, source: 'neon_auth' | 'profiles' } = { table: 'neon_auth."user"', col: '"createdAt"', source: 'neon_auth' }
    try {
      await q(sql, 'select 1 from neon_auth."user" limit 1')
    } catch {
      signups = { table: 'profiles', col: 'created_at', source: 'profiles' }
    }

    const totalsSql = (when: (col: string) => string) => `select
      (select count(*) from page_views where ${when('ts')}) as views,
      (select count(distinct session_id) from page_views where ${when('ts')}) as visitors,
      (select count(*) from ${signups.table} where ${when(signups.col)}) as signups,
      (select count(*) from stories where not sample and ${when('created_at')}) as stories,
      (select count(*) from guestbook where not sample and ${when('created_at')}) as guestbook,
      (select count(*) from comments where not sample and ${when('ts')}) as comments,
      (select count(*) from payments where status = 'paid' and ${when('created_at')}) as payments,
      (select coalesce(sum(amount), 0) from payments where status = 'paid' and ${when('created_at')}) as money`

    const per = (name: string, from: string, col: string, agg: string, where = 'true') => `
      left join (select ${bucket(col)} as t, ${agg} as ${name} from ${from}
        where ${col} ${cur} and ${where} group by 1) ${name}_b using (t)`

    // Postgres refuses a bound parameter a statement never uses, so the
    // queries that do not bucket get the interval alone.
    const params = [range.interval, tz]
    const only = [range.interval]
    const [current, previous, series, topPages, referrers, countries, devices] = await Promise.all([
      q(sql, totalsSql(col => `${col} ${cur}`), only),
      q(sql, totalsSql(between), only),
      q(sql, `
        with b as (
          select generate_series(
            date_trunc('${range.unit}', now() at time zone $2) - ${range.buckets - 1} * interval '${range.step}',
            date_trunc('${range.unit}', now() at time zone $2),
            interval '${range.step}') as t
        )
        select to_char(b.t, 'YYYY-MM-DD"T"HH24:MI') as t,
          coalesce(views, 0) as views, coalesce(visitors, 0) as visitors, coalesce(signups, 0) as signups,
          coalesce(stories, 0) as stories, coalesce(guestbook, 0) as guestbook, coalesce(comments, 0) as comments,
          coalesce(payments, 0) as payments, coalesce(money, 0) as money
        from b
        ${per('views', 'page_views', 'ts', 'count(*)')}
        ${per('visitors', 'page_views', 'ts', 'count(distinct session_id)')}
        ${per('signups', signups.table, signups.col, 'count(*)')}
        ${per('stories', 'stories', 'created_at', 'count(*)', 'not sample')}
        ${per('guestbook', 'guestbook', 'created_at', 'count(*)', 'not sample')}
        ${per('comments', 'comments', 'ts', 'count(*)', 'not sample')}
        ${per('payments', 'payments', 'created_at', 'count(*)', `status = 'paid'`)}
        ${per('money', 'payments', 'created_at', 'sum(amount)', `status = 'paid'`)}
        order by b.t`, params),
      q<{ path: string, views: string, visitors: string }>(sql, `
        select path, count(*) as views, count(distinct session_id) as visitors from page_views
        where ts ${cur} group by path order by views desc limit 25`, only),
      q<{ host: string, views: string, visitors: string }>(sql, `
        select referrer as host, count(*) as views, count(distinct session_id) as visitors from page_views
        where ts ${cur} and referrer is not null group by 1 order by views desc limit 25`, only),
      q<{ country: string, visitors: string, views: string }>(sql, `
        select coalesce(country, '??') as country, count(distinct session_id) as visitors, count(*) as views
        from page_views where ts ${cur} group by 1 order by visitors desc, views desc limit 100`, only),
      q<{ device: string, visitors: string }>(sql, `
        select coalesce(s.device, 'unknown') as device, count(distinct p.session_id) as visitors
        from page_views p left join sessions s on s.id = p.session_id
        where p.ts ${cur} group by 1 order by visitors desc`, only)
    ])

    const totals = (row: Record<string, unknown> | undefined): Totals => ({
      views: num(row?.views),
      visitors: num(row?.visitors),
      signups: num(row?.signups),
      stories: num(row?.stories),
      guestbook: num(row?.guestbook),
      comments: num(row?.comments),
      payments: num(row?.payments),
      money: num(row?.money)
    })
    const countryVisitors = countries.reduce((sum, r) => sum + num(r.visitors), 0)
    const deviceVisitors = devices.reduce((sum, r) => sum + num(r.visitors), 0)

    return {
      range: key,
      unit: range.unit,
      tz,
      totals: { current: totals(current[0]), previous: totals(previous[0]) },
      series: series.map(r => ({
        t: String(r.t),
        views: num(r.views),
        visitors: num(r.visitors),
        signups: num(r.signups),
        stories: num(r.stories),
        guestbook: num(r.guestbook),
        comments: num(r.comments),
        payments: num(r.payments),
        money: num(r.money)
      })),
      topPages: topPages.map(r => ({ path: r.path, views: num(r.views), visitors: num(r.visitors) })),
      referrers: referrers.map(r => ({ host: r.host, views: num(r.views), visitors: num(r.visitors) })),
      countries: countries.map(r => ({
        country: r.country,
        visitors: num(r.visitors),
        views: num(r.views),
        share: countryVisitors ? num(r.visitors) / countryVisitors : 0
      })),
      devices: devices.map(r => ({ device: r.device, visitors: num(r.visitors), share: deviceVisitors ? num(r.visitors) / deviceVisitors : 0 })),
      signupsSource: signups.source
    }
  })
})
