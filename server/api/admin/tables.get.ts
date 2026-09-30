/** The browsable tables, their approximate row counts and what an admin may do to each. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')
  const rows = await q<{ relname: string, n: string }>(sql, `
    select relname, n_live_tup as n from pg_stat_user_tables
    where schemaname = 'public' and relname = any($1::text[])`, [BROWSABLE_TABLES as unknown as string[]])
  return {
    items: BROWSABLE_TABLES.map((name) => {
      const spec = TABLE_SPECS[name]
      return {
        name,
        rows: num(rows.find(r => r.relname === name)?.n),
        exists: rows.some(r => r.relname === name),
        key: spec.key ?? null,
        editable: editFields(spec),
        deletable: Boolean(spec.deletable),
        note: spec.note ?? null
      }
    })
  }
})
