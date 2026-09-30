/** Delete one row from a table that allows it; audited in the same statement. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const sql = requireDb(event)
  const table = browsableTable(getRouterParam(event, 'name'))
  const spec = TABLE_SPECS[table]
  const columns = await tableColumns(sql, table)
  const id = rowKey(columns, spec, getRouterParam(event, 'id'))
  await auditedDelete(event, sql, admin, table, id)
  return { deleted: true }
})
