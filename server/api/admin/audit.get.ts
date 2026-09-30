import { z } from 'zod'

const schema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  size: z.coerce.number().int().min(1).max(200).default(50),
  table: z.string().max(63).optional(),
  action: z.string().max(40).optional()
})

/** The admin audit trail, newest first. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  const { page, size, table, action } = queryValid(event, schema)
  setResponseHeader(event, 'cache-control', 'private, no-store')
  const [rows, count, actions] = await Promise.all([
    q<Record<string, unknown>>(sql, `
      select id, admin_email, action, table_name, row_id, before, after, created_at from admin_audit
      where ($1::text is null or table_name = $1) and ($2::text is null or action = $2)
      order by created_at desc, id desc limit $3 offset $4`, [table || null, action || null, size, (page - 1) * size]),
    q<{ n: string }>(sql, `select count(*) as n from admin_audit
      where ($1::text is null or table_name = $1) and ($2::text is null or action = $2)`, [table || null, action || null]),
    q<{ action: string }>(sql, 'select distinct action from admin_audit order by action')
  ])
  return {
    items: rows.map(r => ({
      id: Number(r.id),
      adminEmail: r.admin_email,
      action: r.action,
      table: r.table_name,
      rowId: r.row_id,
      before: r.before,
      after: r.after,
      createdAt: r.created_at
    })),
    actions: actions.map(a => a.action),
    page,
    size,
    total: num(count[0]?.n)
  }
})
