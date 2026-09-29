/**
 * First-party page-view counting. On every route change, one small POST to
 * /api/track with the path and (on the first page only) the referring page.
 * No third-party script, no fingerprinting; the server keeps a random cookie id,
 * the path, the referring site's host and the country Cloudflare reports.
 *
 * Admin pages are not counted, and nothing is sent in development builds that
 * have no server behind them: a failed request is ignored.
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()
  let first = true
  let last = ''

  function send(path: string) {
    if (path === last || path.startsWith('/admin')) {
      return
    }
    last = path
    const referrer = first ? document.referrer || null : null
    first = false
    fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path, referrer }),
      keepalive: true,
      credentials: 'same-origin'
    }).catch(() => {})
  }

  router.afterEach((to, _from, failure) => {
    if (!failure) {
      send(to.path)
    }
  })

  // The first page: afterEach may already have fired during hydration.
  onNuxtReady(() => send(router.currentRoute.value.path))
})
