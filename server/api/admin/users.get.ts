/**
 * Everybody who has signed in and done something (the `profiles` mirror), with
 * how much they have written. Accounts that signed in and never wrote anything
 * live only in Neon Auth and are counted separately when that table is readable.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sql = requireDb(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')

  const rows = await q<Record<string, unknown>>(sql, `
    select p.id, p.email, p.name, p.image, p.created_at, p.last_seen,
      (select count(*) from stories s where s.user_id = p.id) as stories,
      (select count(*) from comments c where c.user_id = p.id) as comments,
      (select count(*) from guestbook g where g.user_id = p.id) as guestbook,
      (select coalesce(sum(amount), 0) from payments y where y.user_id = p.id and y.status = 'paid') as paid
    from profiles p order by p.last_seen desc limit 500`)

  let authUsers: number | null
  try {
    const [row] = await q(sql, 'select count(*) as n from neon_auth."user"')
    authUsers = num(row?.n)
  } catch {
    authUsers = null
  }

  return {
    authUsers,
    items: rows.map(r => ({
      id: r.id,
      email: r.email,
      name: r.name,
      image: r.image,
      createdAt: r.created_at,
      lastSeen: r.last_seen,
      stories: num(r.stories),
      comments: num(r.comments),
      guestbook: num(r.guestbook),
      paid: num(r.paid),
      isAdmin: isAdminEmail(event, String(r.email))
    }))
  }
})
