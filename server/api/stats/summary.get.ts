const EMPTY = {
  visitors: 0,
  pageViews: 0,
  liveNow: 0,
  countries: 0,
  stories: 0,
  jobsGot: 0,
  guestbook: 0,
  raised: 0,
  sponsors: 0
}

/**
 * The public numbers. One round trip, cached at the edge for a minute so a
 * busy home page does not become a busy database. Sample content
 * (scripts/seed-samples.mjs) is never counted.
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'public, max-age=30, s-maxage=60')
  return await softRead(event, EMPTY, async (sql) => {
    const [row] = await q(sql, `select
      (select count(*) from sessions) as visitors,
      (select count(*) from page_views) as page_views,
      (select count(*) from sessions where last_seen > now() - interval '5 minutes') as live_now,
      (select count(distinct country) from sessions where country is not null) as countries,
      (select count(*) from stories where status <> 'hidden' and not sample) as stories,
      (select count(*) from jobs_got) as jobs_got,
      (select count(*) from guestbook where not hidden and not sample) as guestbook,
      (select coalesce(sum(amount), 0) from payments where status = 'paid') as raised,
      (select count(distinct coalesce(user_id, sponsor_url)) from sponsor_bids where status = 'paid') as sponsors`)
    return {
      visitors: num(row?.visitors),
      pageViews: num(row?.page_views),
      liveNow: num(row?.live_now),
      countries: num(row?.countries),
      stories: num(row?.stories),
      jobsGot: num(row?.jobs_got),
      guestbook: num(row?.guestbook),
      raised: num(row?.raised),
      sponsors: num(row?.sponsors)
    }
  })
})
