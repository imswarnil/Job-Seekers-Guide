/** `{ user: null }` or `{ user: { id, name, image, isAdmin } }`. Never throws. */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'private, no-store')
  const user = await getSessionUser(event)
  if (!user) {
    return { user: null, authConfigured: Boolean(await authConfig(event)) }
  }
  return {
    user: { id: user.id, name: user.name, email: user.email, image: user.image, isAdmin: user.isAdmin },
    authConfigured: true
  }
})
