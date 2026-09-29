/** Everything the signed-in user has written, for /account. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const sql = requireDb(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')

  const [stories, comments, guestbook] = await Promise.all([
    q<{ id: string, title: string, status: string, votes: number, created_at: string }>(sql,
      'select id, title, status, votes, created_at from stories where user_id = $1 order by created_at desc', [user.id]),
    q<{ id: string, path: string, body: string, ts: string }>(sql,
      'select id, path, body, ts from comments where user_id = $1 order by ts desc limit 200', [user.id]),
    q<{ id: string, message: string, created_at: string }>(sql,
      'select id, message, created_at from guestbook where user_id = $1 order by created_at desc', [user.id])
  ])

  return {
    user: { id: user.id, name: user.name, email: user.email, image: user.image, isAdmin: user.isAdmin },
    stories: stories.map(s => ({ id: Number(s.id), title: s.title, status: s.status, votes: num(s.votes), createdAt: s.created_at })),
    comments: comments.map(c => ({ id: Number(c.id), path: c.path, body: c.body, createdAt: c.ts })),
    guestbook: guestbook.map(g => ({ id: Number(g.id), message: g.message, createdAt: g.created_at }))
  }
})
