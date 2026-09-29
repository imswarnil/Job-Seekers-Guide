import { z } from 'zod'

const schema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  size: z.coerce.number().int().min(1).max(200).default(50)
})

/**
 * One page of one table, newest first where the table has an obvious order.
 * Read-only: runs in a READ ONLY transaction, so even a mistake here cannot write.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  const name = getRouterParam(event, 'name') || ''
  const table = BROWSABLE_TABLES.find(t => t === name)
  if (!table) {
    throw createError({ statusCode: 404, statusMessage: 'No such table' })
  }
  const { page, size } = queryValid(event, schema)

  const columns = await q<{ column_name: string }>(sql, `
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = $1 order by ordinal_position`, [table])
  const names = columns.map(c => c.column_name)
  const orderBy = ['created_at', 'ts', 'at', 'received_at', 'last_seen', 'applied_at', 'id'].find(c => names.includes(c))

  const [rows, count] = await sql.transaction([
    sql.query(`select * from "${table}" ${orderBy ? `order by "${orderBy}" desc` : ''} limit $1 offset $2`, [size, (page - 1) * size]),
    sql.query(`select count(*) as n from "${table}"`)
  ], { readOnly: true }) as [Record<string, unknown>[], { n: string }[]]

  return { table, columns: names, rows, page, size, total: num(count[0]?.n) }
})
