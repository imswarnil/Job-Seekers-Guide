/** Delete a story, its votes, its media rows and its files in R2. Audited. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const sql = requireDb(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({ statusCode: 404, statusMessage: 'Story not found' })
  }
  await auditedDelete(event, sql, admin, 'stories', String(id))
  return { deleted: true }
})
