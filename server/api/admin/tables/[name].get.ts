import { z } from 'zod'

const schema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  size: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.string().max(63).optional(),
  dir: z.enum(['asc', 'desc']).default('desc'),
  q: z.string().max(200).optional(),
  f: z.string().max(4000).optional(),
  format: z.enum(['json', 'csv']).default('json')
})

/** The most rows a CSV export carries. */
const EXPORT_LIMIT = 10_000

function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  const text = value instanceof Date ? value.toISOString() : typeof value === 'object' ? JSON.stringify(value) : String(value)
  // Quote everything that needs it, and defuse spreadsheet formulas.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/**
 * One filtered, sorted page of one table, or the whole filtered view as CSV.
 * Read-only: runs in a READ ONLY transaction, so even a mistake here cannot write.
 *
 *   ?page=&size=           pagination
 *   ?sort=<column>&dir=    any real column of the table
 *   ?q=                    matches any text column
 *   ?f=[{col,op,value}]    op: contains | eq | gte | lte | null | notnull
 *   ?format=csv            the current filtered view, up to 10,000 rows
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  const table = browsableTable(getRouterParam(event, 'name'))
  const input = queryValid(event, schema)
  setResponseHeader(event, 'cache-control', 'private, no-store')

  const columns = await tableColumns(sql, table)
  const filters = parseFilters(input.f)
  const { where, params } = buildWhere(columns, filters, input.q)
  const order = buildOrder(columns, input.sort, input.dir)
  const n = params.length

  if (input.format === 'csv') {
    const [rows] = await sql.transaction([
      sql.query(`select * from "${table}" ${where} ${order} limit $${n + 1}`, [...params, EXPORT_LIMIT])
    ], { readOnly: true }) as [Record<string, unknown>[]]
    const names = columns.map(c => c.name)
    const lines = [names.join(','), ...rows.map(r => names.map(c => csvCell(r[c])).join(','))]
    const stamp = new Date().toISOString().slice(0, 10)
    setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
    setResponseHeader(event, 'content-disposition', `attachment; filename="${table}-${stamp}.csv"`)
    return `${lines.join('\r\n')}\r\n`
  }

  const [rows, count] = await sql.transaction([
    sql.query(`select * from "${table}" ${where} ${order} limit $${n + 1} offset $${n + 2}`, [...params, input.size, (input.page - 1) * input.size]),
    sql.query(`select count(*) as n from "${table}" ${where}`, params)
  ], { readOnly: true }) as [Record<string, unknown>[], { n: string }[]]

  const spec = TABLE_SPECS[table]
  return {
    table,
    columns,
    key: spec.key ?? null,
    editable: editFields(spec),
    deletable: Boolean(spec.deletable),
    note: spec.note ?? null,
    rows,
    page: input.page,
    size: input.size,
    total: num(count[0]?.n)
  }
})
