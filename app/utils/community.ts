/**
 * Small helpers for the server-backed pages (stories, guestbook, sponsors,
 * support, stats, admin). Money arrives from the API in paise.
 */
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const count = new Intl.NumberFormat('en-IN')
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatPaise(paise: number | null | undefined): string {
  return rupees.format(Math.round((paise ?? 0) / 100))
}

export function formatCount(value: number | null | undefined): string {
  return count.format(value ?? 0)
}

export function formatDay(value: string | Date | null | undefined): string {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : day.format(date)
}

/** "3 minutes ago", "yesterday", or the date. */
export function formatAgo(value: string | Date | null | undefined): string {
  if (!value) {
    return ''
  }
  const then = new Date(value).getTime()
  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 60) {
    return 'just now'
  }
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }
  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  const days = Math.round(hours / 24)
  if (days === 1) {
    return 'yesterday'
  }
  return days < 14 ? `${days} days ago` : formatDay(value)
}

/** The message a failed `$fetch` carries from our API, in words a reader can act on. */
export function apiError(error: unknown, fallback = 'Something went wrong. Try again in a minute.'): string {
  const e = error as { data?: { statusMessage?: string, message?: string }, statusMessage?: string, statusCode?: number } | undefined
  const message = e?.data?.statusMessage || e?.statusMessage || e?.data?.message
  if (e?.statusCode === 401) {
    return 'Sign in first.'
  }
  return message && !/^(fetch failed|internal server error)$/i.test(message) ? message : fallback
}

/** Country code to flag emoji and English name. */
const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en-GB'], { type: 'region' }) : null

export function countryName(code: string | null | undefined): string {
  if (!code || code === '??') {
    return 'Unknown'
  }
  try {
    return regionNames?.of(code) || code
  } catch {
    return code
  }
}

export function countryFlag(code: string | null | undefined): string {
  if (!code || !/^[A-Z]{2}$/.test(code)) {
    return '🏳️'
  }
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}

/** A YouTube watch/share link to its embed URL on the privacy-enhanced domain. */
export function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\.|^m\./, '')
    let id: string | null | undefined = null
    if (host === 'youtu.be') {
      id = u.pathname.slice(1)
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id = u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1]
    }
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
  } catch {
    return null
  }
}

export function youtubeThumb(url: string): string | null {
  const embed = youtubeEmbed(url)
  const id = embed?.split('/').pop()
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}
