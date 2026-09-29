/**
 * A GIF is only ever an https link to GIPHY's or Tenor's media hosts. Nothing
 * else is embedded, so a guestbook entry cannot load an arbitrary image from an
 * arbitrary server (a tracking pixel, or worse).
 */
const HOSTS = [/^(media\d*|i)\.giphy\.com$/, /^(media\d*|c)\.tenor\.com$/]

export function isAllowedGif(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && HOSTS.some(h => h.test(url.hostname))
  } catch {
    return false
  }
}

/** Page links (giphy.com/gifs/…-ID) become the direct media link. */
export function normaliseGif(value: string): string | null {
  const trimmed = value.trim()
  if (isAllowedGif(trimmed)) {
    return trimmed
  }
  try {
    const url = new URL(trimmed)
    if (url.hostname === 'giphy.com' || url.hostname === 'www.giphy.com') {
      const id = url.pathname.match(/\/(?:gifs|stickers)\/(?:[\w-]*-)?([A-Za-z0-9]+)\/?$/)?.[1]
      return id ? `https://i.giphy.com/${id}.gif` : null
    }
  } catch {
    return null
  }
  return null
}
