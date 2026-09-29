export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  const rows = await q(sql, 'delete from comments where id = $1 returning id', [Number(getRouterParam(event, 'id'))])
  if (!rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
  }
  return { deleted: true }
})
