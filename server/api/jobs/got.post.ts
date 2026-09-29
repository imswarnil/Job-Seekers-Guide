import { z } from 'zod'

const schema = z.object({
  company: optionalText(80),
  package: optionalText(40)
})

/** "Did you get a job?" One per browser session; a second press updates the first. */
export default defineEventHandler(async (event) => {
  const sql = requireDb(event)
  const input = await readValid(event, schema)
  await rateLimit(event, sql, `jobs:${clientIp(event)}`, 10, 3600)

  const id = visitorId(event, true)!
  const [row] = await q<{ created: boolean }>(sql, `
    with s as (
      insert into sessions (id, country) values ($1, $2)
      on conflict (id) do update set last_seen = now()
      returning id
    )
    insert into jobs_got (session_id, company, package)
    select id, $3, $4 from s
    on conflict (session_id) do update set
      company = coalesce(excluded.company, jobs_got.company),
      package = coalesce(excluded.package, jobs_got.package)
    returning (xmax = 0) as created`, [id, country(event), input.company ?? null, input.package ?? null])

  const [count] = await q(sql, 'select count(*) as n from jobs_got')
  return { ok: true, alreadyCounted: row ? !row.created : false, jobsGot: num(count?.n) }
})
