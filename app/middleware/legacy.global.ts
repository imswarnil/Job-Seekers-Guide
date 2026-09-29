/**
 * Old URLs, redirected in the browser.
 *
 * GitHub Pages cannot send a 301. It serves `404.html` for any path it has no
 * file for and leaves the requested URL in the address bar, so the app boots,
 * this middleware sees where the reader was trying to go, and sends them on.
 *
 * Two generations of URL land here: the pages of the old marketing site, and
 * the tracks of the old course that were removed or renamed when it became the
 * Bangalore guide on 2026-09-29.
 */

/** Exact matches, checked first. */
const exact: Record<string, string> = {
  '/start': '/',
  '/path': '/',
  '/courses': '/',
  '/faq': '/',
  '/about': '/',
  '/changelog': '/',
  '/blog': '/',
  '/docs': '/',
  '/run': '/',
  '/search': '/',
  // `/login` is a real page again (sign-in for stories and the guestbook).
  '/signup': '/login',
  '/series': '/my-story'
}

/**
 * Old track prefixes. A track that was renamed goes to its new home; a track
 * that was removed goes to the nearest thing that replaced it, or home.
 */
const prefixes: [string, string][] = [
  ['/courses/', '/'],
  ['/series/', '/my-story'],
  ['/docs/', '/'],
  ['/blog/', '/'],
  ['/changelog/', '/'],
  ['/orientation', '/bangalore'],
  ['/terminal', '/other-subjects'],
  ['/data-structures', '/dsa'],
  ['/aptitude', '/quantitative-aptitude'],
  ['/english', '/verbal-ability'],
  ['/typescript', '/javascript'],
  ['/react', '/javascript'],
  ['/nextjs', '/javascript'],
  ['/data-visualisation', '/'],
  ['/toolchain', '/other-subjects'],
  ['/project', '/'],
  ['/hosting', '/other-subjects'],
  ['/nosql', '/dbms'],
  ['/supabase', '/dbms'],
  ['/ai', '/']
]

export default defineNuxtRouteMiddleware((to) => {
  // GitHub Pages serves every page as a folder with an index.html, and answers
  // `/java/strings` with a redirect to `/java/strings/`. Content paths have no
  // trailing slash, so without this every lesson reached that way was a 404.
  if (to.path.length > 1 && to.path.endsWith('/')) {
    return navigateTo({ path: to.path.replace(/\/+$/, ''), query: to.query, hash: to.hash }, { replace: true })
  }

  const target = exact[to.path]
  if (target) {
    return navigateTo(target, { redirectCode: 301, replace: true })
  }

  for (const [prefix, destination] of prefixes) {
    // Match the whole segment, so `/ai` does not catch `/aptitude`.
    if (to.path === prefix || to.path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)) {
      if (destination !== to.path) {
        return navigateTo(destination, { redirectCode: 301, replace: true })
      }
    }
  }
})
