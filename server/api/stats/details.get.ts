/**
 * The public detail behind /stats: where readers are, what they read, and the
 * last 30 days of page views. (An extension of the contract.) Aggregates only;
 * nothing here identifies anybody.
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'public, max-age=60, s-maxage=300')
  const empty = {
    countries: [] as { country: string, visitors: number }[],
    topPages: [] as { path: string, views: number }[],
    perDay: [] as { day: string, views: number }[]
  }
  return await softRead(event, empty, async (sql) => {
    const [countries, topPages, perDay] = await Promise.all([
      q<{ country: string, visitors: string }>(sql, `
        select country, count(*) as visitors from sessions
        where country is not null group by country order by visitors desc limit 100`),
      q<{ path: string, views: string }>(sql, `
        select path, count(*) as views from page_views
        where ts > now() - interval '30 days' and path not like '/admin%' and path not like '/account%'
        group by path order by views desc limit 15`),
      q<{ day: string, views: string }>(sql, `
        select to_char(d.day, 'YYYY-MM-DD') as day, coalesce(v.views, 0) as views
        from generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') as d(day)
        left join (select date_trunc('day', ts) as day, count(*) as views from page_views
                   where ts > now() - interval '30 days' group by 1) v on v.day = d.day
        order by d.day`)
    ])
    return {
      countries: countries.map(r => ({ country: r.country, visitors: num(r.visitors) })),
      topPages: topPages.map(r => ({ path: r.path, views: num(r.views) })),
      perDay: perDay.map(r => ({ day: r.day, views: num(r.views) }))
    }
  })
})
