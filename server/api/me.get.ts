/** `{ user: null }` or `{ user: { id, name, image, isAdmin } }`. 503 only when the session lookup itself timed out, so the client retries. */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'private, no-store')
  const user = await getSessionUser(event)
  if (!user) {
    // The lookup failed rather than finding nobody: tell the client to retry.
    if ((event.context as { sessionLookupFailed?: boolean }).sessionLookupFailed) {
      throw createError({ statusCode: 503, statusMessage: 'Sign-in is slow to answer. Trying again.' })
    }
    return { user: null, authConfigured: Boolean(await authConfig(event)) }
  }
  return {
    user: { id: user.id, name: user.name, email: user.email, image: user.image, isAdmin: user.isAdmin },
    authConfigured: true
  }
})
