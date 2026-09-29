/** Delete a story, its votes, its media rows and its files in R2. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  const id = Number(getRouterParam(event, 'id'))
  const files = await q<{ r2_key: string }>(sql, 'select r2_key from story_media where story_id = $1 and r2_key is not null', [id])
  const bucket = uploadsBucket(event)
  if (bucket && files.length) {
    await bucket.delete(files.map(f => f.r2_key))
  }
  const rows = await q(sql, 'delete from stories where id = $1 returning id', [id])
  if (!rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Story not found' })
  }
  if (files.length) {
    await q(sql, 'delete from uploads where key = any($1::text[])', [files.map(f => f.r2_key)])
  }
  return { deleted: true }
})
