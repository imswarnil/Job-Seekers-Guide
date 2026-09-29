import { z } from 'zod'

const schema = z.object({
  q: z.string().trim().max(50).optional()
})

/**
 * GIF search for the guestbook picker, through GIPHY when GIPHY_API_KEY is set.
 * The key stays on the server. Without it: `{ enabled: false }`, and the picker
 * falls back to pasting a GIPHY or Tenor link.
 */
export default defineEventHandler(async (event) => {
  const key = useServerEnv(event).GIPHY_API_KEY
  if (!key) {
    return { enabled: false, items: [] }
  }
  const { q: term } = queryValid(event, schema)
  const endpoint = term ? 'search' : 'trending'
  const url = new URL(`https://api.giphy.com/v1/gifs/${endpoint}`)
  url.searchParams.set('api_key', key)
  url.searchParams.set('limit', '24')
  url.searchParams.set('rating', 'g')
  if (term) {
    url.searchParams.set('q', term)
  }

  setResponseHeader(event, 'cache-control', 'public, max-age=300, s-maxage=600')
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } })
    if (!response.ok) {
      return { enabled: true, items: [] }
    }
    const body = await response.json() as {
      data?: { id: string, title?: string, images?: { fixed_width?: { url?: string }, original?: { url?: string } } }[]
    }
    return {
      enabled: true,
      items: (body.data ?? []).map(g => ({
        id: g.id,
        title: g.title || 'GIF',
        preview: g.images?.fixed_width?.url?.split('?')[0],
        url: g.images?.original?.url?.split('?')[0]
      })).filter(g => g.preview && g.url && isAllowedGif(g.url))
    }
  } catch {
    return { enabled: true, items: [] }
  }
})
