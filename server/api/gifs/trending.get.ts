/**
 * What is trending on GIPHY, for the guestbook picker before anything has been
 * typed. Same key, same `g` rating and same shape as `/api/gifs/search`, and
 * the same `{ enabled: false }` when GIPHY_API_KEY is not set.
 */
export default defineEventHandler(async (event) => {
  const key = useServerEnv(event).GIPHY_API_KEY
  if (!key) {
    return { enabled: false, items: [] }
  }
  const url = new URL('https://api.giphy.com/v1/gifs/trending')
  url.searchParams.set('api_key', key)
  url.searchParams.set('limit', '24')
  url.searchParams.set('rating', 'g')

  const cacheKey = 'trending'
  const cached = gifCacheGet<{ enabled: true, items: unknown[] }>(cacheKey, 15 * 60_000)
  setResponseHeader(event, 'cache-control', 'public, max-age=600, s-maxage=1800')
  if (cached) {
    return cached
  }
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } })
    if (!response.ok) {
      return { enabled: true, items: [] }
    }
    const body = await response.json() as {
      data?: { id: string, title?: string, images?: { fixed_width?: { url?: string }, original?: { url?: string } } }[]
    }
    const out = {
      enabled: true,
      items: (body.data ?? []).map(g => ({
        id: g.id,
        title: g.title || 'GIF',
        preview: g.images?.fixed_width?.url?.split('?')[0],
        url: g.images?.original?.url?.split('?')[0]
      })).filter(g => g.preview && g.url && isAllowedGif(g.url))
    }
    gifCachePut(cacheKey, out)
    return out
  } catch {
    return { enabled: true, items: [] }
  }
})
