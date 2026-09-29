import { z } from 'zod'
import { handleAuthProxyRequest } from '@neondatabase/auth/server'

// In the query string, not a body: nitro's Workers adapter does not hand a
// DELETE body to h3, and reading one there waits forever.
const schema = z.object({
  confirm: z.literal('DELETE', 'type DELETE to confirm')
})

/**
 * Delete the account and everything its owner wrote: stories (and their
 * uploaded files), votes, comments and guestbook entries. Payments and sponsor
 * bids are kept, detached from the account, because they are financial
 * records; a sponsor's name on the leaderboard stays until an admin hides it.
 *
 * Order matters: vote counts are corrected before the votes go, files are
 * removed from R2 before the rows that list them, then the profile row goes and
 * cascades, then the Neon Auth user, then the session cookies.
 */
export default defineEventHandler(async (event) => {
  queryValid(event, schema)
  const user = await requireUser(event)
  const sql = requireDb(event)

  const files = await q<{ key: string }>(sql, `
    select key from uploads where user_id = $1
    union
    select m.r2_key from story_media m join stories s on s.id = m.story_id
    where s.user_id = $1 and m.r2_key is not null`, [user.id])

  const bucket = uploadsBucket(event)
  if (bucket && files.length) {
    const keys = files.map(f => f.key)
    for (let i = 0; i < keys.length; i += 1000) {
      await bucket.delete(keys.slice(i, i + 1000))
    }
  }

  await sql.transaction([
    sql`update stories s set votes = greatest(s.votes - 1, 0)
        from story_votes v where v.story_id = s.id and v.user_id = ${user.id}`,
    sql`delete from profiles where id = ${user.id}`
  ])

  // The account itself. Better Auth's delete-user endpoint first, with the
  // user's own session; if the project has it switched off, remove the row
  // directly (the database owner role can).
  let authDeleted = false
  const config = await authConfig(event)
  if (config) {
    try {
      const origin = getRequestURL(event).origin
      const response = await handleAuthProxyRequest({
        request: new Request(`${origin}/api/auth/delete-user`, {
          method: 'POST',
          headers: { 'cookie': getRequestHeader(event, 'cookie') || '', origin, 'content-type': 'application/json' },
          body: '{}'
        }),
        path: 'delete-user',
        ...config
      })
      authDeleted = response.ok
    } catch {
      authDeleted = false
    }
  }
  if (!authDeleted) {
    for (const statement of [
      'delete from neon_auth."user" where id::text = $1',
      'delete from neon_auth.users_sync where id::text = $1'
    ]) {
      try {
        await q(sql, statement, [user.id])
        authDeleted = true
      } catch {
        // That table is not there in this project's Neon Auth version.
      }
    }
  }

  // Sign out: expire every Neon Auth cookie on this domain.
  for (const name of [
    '__Secure-neon-auth.session_token',
    '__Secure-neon-auth.local.session_data',
    '__Secure-neon-auth.session_challenge'
  ]) {
    appendResponseHeader(event, 'set-cookie', `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`)
  }

  return { deleted: true, accountRemoved: authDeleted }
})
