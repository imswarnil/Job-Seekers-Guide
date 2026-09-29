/**
 * `definePageMeta({ middleware: 'admin' })`: admins only (emails in ADMIN_EMAILS).
 * The server checks again on every /api/admin/* call; this is the courtesy.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }
  const { whenReady } = useUser()
  const user = await whenReady()
  if (!user) {
    return navigateTo({ path: '/login', query: { next: to.fullPath } })
  }
  if (!user.isAdmin) {
    return navigateTo('/account')
  }
})
