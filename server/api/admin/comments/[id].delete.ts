/** Delete a lesson comment. Audited. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const sql = requireDb(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
  }
  await auditedDelete(event, sql, admin, 'comments', String(id))
  return { deleted: true }
})
