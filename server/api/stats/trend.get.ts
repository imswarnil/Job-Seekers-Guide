import { z } from 'zod'

const schema = z.object({
  days: z.coerce.number().int().refine(d => d === 30 || d === 90 || d === 365, 'must be 30, 90 or 365').default(30)
})

/** Days are counted in India time: most readers are there, and a UTC day splits their evening in two. */
const TZ = 'Asia/Kolkata'

interface Day { day: string, visitors: number, views: number, signups: number, raised: number }

/**
 * The daily trend behind the charts on /stats: unique visitors, page views,
 * new accounts and money raised (paid payments, paise, by the day the
 * checkout was opened) for each of the last 30, 90 or 365 days, oldest first,
 * every day present (zeros included). Aggregates only; nothing here
 * identifies anybody. Admin and account pages are left out, as in
 * /api/stats/details.
 *
 * Sign-ups come from Neon Auth's own user table when the database role can read
 * it, and from `profiles` (accounts that have written something) when not; the
 * sample-data profile is never counted.
 */
export default defineEventHandler(async (event) => {
  const { days } = queryValid(event, schema)
  setResponseHeader(event, 'cache-control', 'public, max-age=60, s-maxage=60')

  const empty = { range: days, tz: TZ, totals: { visitors: 0, views: 0, signups: 0, raised: 0 }, days: [] as Day[] }
  return await softRead(event, empty, async (sql) => {
    let signups = `select ("createdAt" at time zone '${TZ}')::date as day, count(*) as n from neon_auth."user"
      where "createdAt" >= (select start from bounds) at time zone '${TZ}' group by 1`
    try {
      await q(sql, 'select 1 from neon_auth."user" limit 1')
    } catch {
      signups = `select (created_at at time zone '${TZ}')::date as day, count(*) as n from profiles
        where id <> '${SAMPLE_PROFILE_ID}' and created_at >= (select start from bounds) at time zone '${TZ}' group by 1`
    }

    // `$1` is the number of days, validated above to one of three values.
    const [rows, totals] = await Promise.all([
      q<{ day: string, visitors: string, views: string, signups: string, raised: string }>(sql, `
        with bounds as (
          select (now() at time zone '${TZ}')::date - ($1::int - 1) as start
        ), views as (
          select (ts at time zone '${TZ}')::date as day, count(*) as views, count(distinct session_id) as visitors
          from page_views
          where ts >= (select start from bounds) at time zone '${TZ}'
            and path not like '/admin%' and path not like '/account%'
          group by 1
        ), signups as (${signups}), raised as (
          select (created_at at time zone '${TZ}')::date as day, sum(amount) as paise
          from payments
          where status = 'paid' and created_at >= (select start from bounds) at time zone '${TZ}'
          group by 1
        )
        select to_char(d.day, 'YYYY-MM-DD') as day,
          coalesce(v.visitors, 0) as visitors, coalesce(v.views, 0) as views, coalesce(s.n, 0) as signups,
          coalesce(r.paise, 0) as raised
        from generate_series((select start from bounds), (now() at time zone '${TZ}')::date, interval '1 day') as d(day)
        left join views v on v.day = d.day::date
        left join signups s on s.day = d.day::date
        left join raised r on r.day = d.day::date
        order by d.day`, [days]),
      q<{ visitors: string, views: string }>(sql, `
        select count(distinct session_id) as visitors, count(*) as views from page_views
        where ts >= ((now() at time zone '${TZ}')::date - ($1::int - 1)) at time zone '${TZ}'
          and path not like '/admin%' and path not like '/account%'`, [days])
    ])

    const series = rows.map(r => ({ day: r.day, visitors: num(r.visitors), views: num(r.views), signups: num(r.signups), raised: num(r.raised) }))
    return {
      range: days,
      tz: TZ,
      totals: {
        visitors: num(totals[0]?.visitors),
        views: num(totals[0]?.views),
        signups: series.reduce((sum, d) => sum + d.signups, 0),
        raised: series.reduce((sum, d) => sum + d.raised, 0)
      },
      days: series
    }
  })
})
