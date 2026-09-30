import type { RouterConfig } from '@nuxt/schema'
import { paneEl, recallPane } from '~/utils/pane'

/**
 * Scrolling happens in the content pane, not the window (see utils/pane.ts),
 * so the router's own scroll handling, which only ever moves `window`, is
 * replaced by one that moves the pane and then tells the router it is done
 * (`false`).
 *
 *   · A new page starts at its top, like turning a page. Finishing a lesson
 *     happens at the bottom, so without this the next one would open halfway.
 *   · A link to `#heading` scrolls the heading into view inside the pane.
 *     Prose headings carry their own scroll margin, so it lands with air above.
 *   · Back and Forward return to where the pane was.
 */
function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.slice(1))
  const el = id ? document.getElementById(id) : null
  if (el) {
    el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
    return true
  }
  return false
}

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp()
    const firstLoad = !from.matched.length

    function run() {
      const pane = paneEl()
      if (!pane) {
        return
      }
      if (savedPosition) {
        pane.scrollTo({ top: recallPane(to.fullPath) ?? 0 })
        return
      }
      if (to.hash && scrollToHash(to.hash)) {
        return
      }
      if (to.path !== from.path) {
        pane.scrollTo({ top: 0 })
      }
    }

    // The browser has already honoured the address it was given.
    if (firstLoad) {
      if (to.hash) {
        requestAnimationFrame(() => scrollToHash(to.hash))
      }
      return false
    }

    // Same page, new heading: nothing is loading, so move now.
    if (to.path === from.path) {
      run()
      return false
    }

    // A different page: wait until it has rendered, or the heading to scroll
    // to does not exist yet.
    return new Promise((resolve) => {
      let done = false
      const finish = () => {
        if (done) {
          return
        }
        done = true
        requestAnimationFrame(() => {
          run()
          resolve(false)
        })
      }
      nuxtApp.hooks.hookOnce('page:loading:end', finish)
      // Never leave a navigation without its scroll if the hook is missed.
      setTimeout(finish, 1500)
    })
  }
}
