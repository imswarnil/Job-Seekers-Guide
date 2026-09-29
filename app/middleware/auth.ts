/**
 * `definePageMeta({ middleware: 'auth' })`: signed-in readers only.
 *
 * Runs in the browser: pages are prerendered or rendered without the reader's
 * session in mind, and the real check is on every API call anyway. This only
 * saves a signed-out reader from a page of 401s by sending them to /login first.
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
})
