/**
 * Edit the safe columns of one row. Only the columns in the table's spec
 * (server/utils/admin.ts) are accepted, each through its own validator; the
 * change and its audit entry are one statement.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const sql = requireDb(event)
  const table = browsableTable(getRouterParam(event, 'name'))
  const spec = TABLE_SPECS[table]
  if (!spec.key || !spec.editable) {
    throw createError({ statusCode: 405, statusMessage: `Rows in ${table} cannot be edited here` })
  }
  const columns = await tableColumns(sql, table)
  const id = rowKey(columns, spec, getRouterParam(event, 'id'))

  let body: unknown
  try {
    body = await readBody(event)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'The request body is not valid JSON' })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Send the changed columns as an object' })
  }

  const changes: Record<string, unknown> = {}
  for (const [col, value] of Object.entries(body as Record<string, unknown>)) {
    const validator = spec.editable[col]
    if (!validator || !columns.some(c => c.name === col)) {
      throw createError({ statusCode: 400, statusMessage: `${col.slice(0, 40)}: this column cannot be edited` })
    }
    const parsed = validator.schema.safeParse(value)
    if (!parsed.success) {
      throw createError({ statusCode: 400, statusMessage: `${col}: ${parsed.error.issues[0]?.message || 'invalid'}`.slice(0, 200) })
    }
    changes[col] = parsed.data
  }
  if (!Object.keys(changes).length) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to change' })
  }

  // A hidden bid goes back on the site only if it was actually paid for.
  if (table === 'sponsor_bids' && changes.status === 'paid') {
    const [bid] = await q<{ paid: boolean }>(sql, `
      select exists (select 1 from payments y where y.id = b.payment_id and y.status = 'paid') as paid
      from sponsor_bids b where b.id::text = $1`, [id])
    if (!bid?.paid) {
      throw createError({ statusCode: 400, statusMessage: 'status: only a bid whose payment went through can be shown' })
    }
  }

  const row = await auditedUpdate(sql, admin, table, id, changes)
  return { row }
})
