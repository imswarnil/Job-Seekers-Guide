/** One story, with all its media, and whether the viewer has voted for it. */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({ statusCode: 404, statusMessage: 'Story not found' })
  }
  const user = await getSessionUser(event)

  const found = await softRead(event, null, async (sql) => {
    const [row] = await q<StoryRow>(sql, `${STORY_SELECT} where s.id = $1`, [id])
    if (!row) {
      return null
    }
    const media = await q<MediaRow>(sql, 'select story_id, kind, url from story_media where story_id = $1 order by position', [id])
    const voted = user
      ? (await q(sql, 'select 1 from story_votes where story_id = $1 and user_id = $2', [id, user.id])).length > 0
      : false
    return { row, media, voted }
  })

  // A hidden story is visible to its author and to admins only.
  if (!found || (found.row.status === 'hidden' && found.row.user_id !== user?.id && !user?.isAdmin)) {
    throw createError({ statusCode: 404, statusMessage: 'Story not found' })
  }

  setResponseHeader(event, 'cache-control', 'private, no-store')
  return {
    ...storyOut(found.row, found.media, true),
    hidden: found.row.status === 'hidden',
    voted: found.voted,
    mine: Boolean(user && found.row.user_id === user.id)
  }
})
