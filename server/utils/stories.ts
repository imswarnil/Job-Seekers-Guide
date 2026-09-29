export interface StoryRow {
  id: string
  title: string
  from_place: string
  to_place: string
  company: string | null
  package: string | null
  body: string
  status: string
  votes: number
  created_at: string
  author_name: string | null
  author_image: string | null
  user_id: string
}

export interface MediaRow {
  story_id: string
  kind: 'image' | 'video' | 'youtube'
  url: string
}

export function snippet(body: string, length = 220) {
  const flat = body.replace(/\s+/g, ' ').trim()
  return flat.length > length ? `${flat.slice(0, length).replace(/\s+\S*$/, '')}…` : flat
}

export function storyOut(row: StoryRow, media: MediaRow[], full = false) {
  const own = media.filter(m => String(m.story_id) === String(row.id))
  return {
    id: Number(row.id),
    title: row.title,
    from: row.from_place,
    to: row.to_place,
    company: row.company,
    package: row.package,
    ...(full ? { body: row.body } : { snippet: snippet(row.body) }),
    media: full ? own.map(m => ({ kind: m.kind, url: m.url })) : own.slice(0, 1).map(m => ({ kind: m.kind, url: m.url })),
    votes: num(row.votes),
    featured: row.status === 'featured',
    author: { name: row.author_name || 'A reader', image: row.author_image },
    createdAt: row.created_at
  }
}

export const STORY_SELECT = `
  select s.id, s.title, s.from_place, s.to_place, s.company, s.package, s.body, s.status, s.votes,
         s.created_at, s.user_id, p.name as author_name, p.image as author_image
  from stories s left join profiles p on p.id = s.user_id`

/** The YouTube video id from any of the usual link shapes, or null. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\.|^m\./, '')
    if (host === 'youtu.be') {
      return u.pathname.slice(1).match(/^[\w-]{11}$/)?.[0] ?? null
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v')
      if (v && /^[\w-]{11}$/.test(v)) {
        return v
      }
      return u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1] ?? null
    }
  } catch {
    return null
  }
  return null
}
