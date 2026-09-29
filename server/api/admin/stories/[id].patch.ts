import { z } from 'zod'

const schema = z.object({ status: z.enum(['visible', 'hidden', 'featured']) })

/** Hide, show or feature a story. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  const id = Number(getRouterParam(event, 'id'))
  const { status } = await readValid(event, schema)
  const rows = await q(sql, 'update stories set status = $2 where id = $1 returning id', [id, status])
  if (!rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Story not found' })
  }
  return { id, status }
})
