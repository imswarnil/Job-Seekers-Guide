import { z } from 'zod'

const schema = z.object({ status: z.enum(['visible', 'hidden', 'featured']) })

/** Hide, show or feature a story. Audited. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const sql = requireDb(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({ statusCode: 404, statusMessage: 'Story not found' })
  }
  const { status } = await readValid(event, schema)
  await auditedUpdate(sql, admin, 'stories', String(id), { status })
  return { id, status }
})
