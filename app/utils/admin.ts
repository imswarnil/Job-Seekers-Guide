/**
 * Shapes and small helpers shared by the /admin pages. Server responses are
 * described here once so every tab reads them the same way.
 */

export type AdminRange = '24h' | '7d' | '30d' | '90d'

export const ADMIN_RANGES: { label: string, value: AdminRange }[] = [
  { label: '24 h', value: '24h' },
  { label: '7 d', value: '7d' },
  { label: '30 d', value: '30d' },
  { label: '90 d', value: '90d' }
]

export const RANGE_WORDS: Record<AdminRange, string> = {
  '24h': 'last 24 hours',
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  '90d': 'last 90 days'
}

export interface AdminTotals {
  views: number
  visitors: number
  signups: number
  stories: number
  guestbook: number
  comments: number
  payments: number
  money: number
}

export interface AdminAnalytics {
  range: AdminRange
  unit: 'hour' | 'day'
  tz: string
  totals: { current: AdminTotals, previous: AdminTotals }
  series: ({ t: string } & AdminTotals)[]
  topPages: { path: string, views: number, visitors: number }[]
  referrers: { host: string, views: number, visitors: number }[]
  countries: { country: string, visitors: number, views: number, share: number }[]
  devices: { device: string, visitors: number, share: number }[]
  signupsSource: 'neon_auth' | 'profiles' | 'none'
}

export interface AdminLive {
  at: string
  online: number
  visitors: { label: string, country: string | null, device: string | null, path: string | null, views: number, firstSeen: string, lastSeen: string }[]
  pages: { path: string, visitors: number }[]
  countries: { country: string, visitors: number }[]
  feed: { id: number, path: string, country: string | null, referrer: string | null, device: string | null, label: string | null, ts: string }[]
  perMinute: { t: string, views: number }[]
}

/** A column of a browsable table, as the server reports it. */
export interface AdminColumn { name: string, type: string, kind: 'text' | 'number' | 'date' | 'boolean' | 'json', nullable: boolean }

/** A column an admin may edit, and the control to edit it with. */
export interface AdminEditField { name: string, input: 'text' | 'textarea' | 'select' | 'switch' | 'url', options: string[] | null, max: number | null }

export interface AdminTablePage {
  table: string
  columns: AdminColumn[]
  key: string | null
  editable: AdminEditField[]
  deletable: boolean
  note: string | null
  rows: Record<string, unknown>[]
  page: number
  size: number
  total: number
}

export interface AdminTableInfo {
  name: string
  rows: number
  exists: boolean
  key: string | null
  editable: AdminEditField[]
  deletable: boolean
  note: string | null
}

/** The range in the URL (`?range=`), so a reload or a shared link keeps it. */
export function useAdminRange(fallback: AdminRange = '7d') {
  const route = useRoute()
  const router = useRouter()
  return computed<AdminRange>({
    get: () => {
      const value = route.query.range
      return ADMIN_RANGES.some(r => r.value === value) ? value as AdminRange : fallback
    },
    set: value => router.replace({ query: { ...route.query, range: value === fallback ? undefined : value } })
  })
}

/** The analytics for the chosen range, in the viewer's time zone. */
export function useAdminAnalytics(range: Ref<AdminRange>) {
  const tz = import.meta.client ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'
  return useFetch<AdminAnalytics>('/api/admin/analytics', {
    query: { range, tz },
    server: false,
    lazy: true
  })
}

/** Percentage change from `previous` to `current`: a number, `'new'`, or null when both are zero. */
export function change(current: number, previous: number): number | 'new' | null {
  if (!previous) {
    return current ? 'new' : null
  }
  return (current - previous) / previous
}

const pct = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1 })
export function formatShare(value: number): string {
  return pct.format(value)
}

const hour = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const shortDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const dayHour = new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })

/**
 * A bucket label. The server sends local wall-clock time without a zone
 * (`2026-09-30T14:00`), which `Date` reads as local time, which is what it is.
 */
export function bucketLabel(t: string, unit: 'hour' | 'day' | 'minute', long = false): string {
  const date = new Date(t)
  if (Number.isNaN(date.getTime())) {
    return t
  }
  if (unit === 'minute') {
    return hour.format(date)
  }
  if (unit === 'hour') {
    return long ? dayHour.format(date) : hour.format(date)
  }
  return long ? formatDay(date) : shortDay.format(date)
}

/** Compact numbers for axis labels: 1.2K, 3.4M. */
const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 })
export function formatCompact(value: number): string {
  return compact.format(value)
}

export function deviceIcon(device: string | null | undefined): string {
  return device === 'mobile'
    ? 'i-lucide-smartphone'
    : device === 'tablet'
      ? 'i-lucide-tablet'
      : device === 'desktop'
        ? 'i-lucide-monitor'
        : 'i-lucide-circle-help'
}

/** Any value from a table row as short display text. */
export function cellText(value: unknown, max = 80): string {
  if (value === null || value === undefined) {
    return '∅'
  }
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return text.length > max ? `${text.slice(0, max)}…` : text
}

/**
 * The live snapshot, refreshed every `every` ms while the tab is visible. The
 * poll pauses in a background tab and catches up as soon as it is shown again.
 */
export function useAdminLive(every = 10_000) {
  const result = useFetch<AdminLive>('/api/admin/live', { server: false, lazy: true })
  let timer: ReturnType<typeof setInterval> | undefined
  const tick = () => {
    if (document.visibilityState === 'visible' && result.status.value !== 'pending') {
      result.refresh()
    }
  }
  const onVisible = () => document.visibilityState === 'visible' && result.refresh()
  onMounted(() => {
    timer = setInterval(tick, every)
    document.addEventListener('visibilitychange', onVisible)
  })
  onBeforeUnmount(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
  })
  return result
}
