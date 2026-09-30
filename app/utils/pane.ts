/**
 * The content pane: the one element in the app that scrolls.
 *
 * The app is a fixed viewport (app/layouts/default.vue): the top bar and the
 * sidebar stay where they are and only the pane moves. So anything that used
 * to scroll or listen to `window` (the router's scroll behaviour, a scroll
 * driven animation, "back to where I was") scrolls or listens to this instead.
 */
export const PANE_ID = 'app-pane'

/** The pane, in the browser. Undefined on the server and before mount. */
export function paneEl(): HTMLElement | undefined {
  if (import.meta.server) {
    return undefined
  }
  return document.getElementById(PANE_ID) || undefined
}

/**
 * Where the pane was scrolled to on each page, so Back lands where you left
 * it. The browser does this for `window` on its own; for an inner scroller it
 * has to be written down. Kept in memory only, like the browser's own.
 */
const positions = new Map<string, number>()

export function rememberPane(key: string, top: number) {
  positions.set(key, top)
  // A long reading session visits hundreds of pages. Keep the recent ones.
  if (positions.size > 200) {
    const oldest = positions.keys().next().value
    if (oldest !== undefined) {
      positions.delete(oldest)
    }
  }
}

export function recallPane(key: string): number | undefined {
  return positions.get(key)
}
