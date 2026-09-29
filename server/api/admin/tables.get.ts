/** The browsable tables and their approximate row counts. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  const rows = await q<{ relname: string, n: string }>(sql, `
    select relname, n_live_tup as n from pg_stat_user_tables
    where schemaname = 'public' and relname = any($1::text[])`, [BROWSABLE_TABLES as unknown as string[]])
  return {
    items: BROWSABLE_TABLES.map(name => ({
      name,
      rows: num(rows.find(r => r.relname === name)?.n),
      exists: rows.some(r => r.relname === name)
    }))
  }
})
