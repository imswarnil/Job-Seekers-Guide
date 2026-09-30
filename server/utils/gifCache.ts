/**
 * A tiny in-memory cache for GIPHY responses.
 *
 * The owner's GIPHY key is on the free tier: about a hundred calls an hour.
 * Every opening of the guestbook picker would spend one on trending and one
 * more per keystroke-ish search, so identical requests within the TTL are
 * answered from here instead. Per isolate only, which is exactly the traffic
 * pattern that burns quota: one reader poking at the picker.
 */
const cache = new Map<string, { at: number, body: unknown }>()

const MAX_ENTRIES = 80

export function gifCacheGet<T>(key: string, ttlMs: number): T | undefined {
  const hit = cache.get(key)
  if (!hit || Date.now() - hit.at > ttlMs) {
    return undefined
  }
  return hit.body as T
}

export function gifCachePut(key: string, body: unknown) {
  if (cache.size >= MAX_ENTRIES) {
    // Drop the oldest entry; insertion order is good enough here.
    const oldest = cache.keys().next().value
    if (oldest) {
      cache.delete(oldest)
    }
  }
  cache.set(key, { at: Date.now(), body })
}
