/**
 * The sponsor slots and their prices. Money is paise throughout.
 *
 * The outbid model: the highest single paid bid on a slot holds it, with no
 * expiry, until somebody pays more. The next bid has to beat the holder by 10%
 * (and by at least ₹10), so a slot cannot be taken for one rupee more.
 *
 * There is exactly one slot, `brand`, and whoever holds it is the site sponsor.
 * Their card shows across the site in two shapes: a leaderboard strip on the
 * home page and at the top of the community pages, and a square beside every
 * lesson and in the sidebar. Bids placed on the older, retired slot names stay
 * in the database and on the leaderboard, but no longer hold anything.
 */
export const SLOTS = {
  brand: { label: 'The site sponsor spot: shown across the whole site', floor: 2_900 }
} as const satisfies Record<string, { label: string, floor: number }>

export type SlotName = keyof typeof SLOTS
export const SLOT_NAMES = Object.keys(SLOTS) as SlotName[]

/**
 * The names the site used when it sold eight spots. There is one spot now, and
 * an old link (`/sponsor?slot=sidebar`) or an old embed still asking for one of
 * these gets the brand spot rather than a 404.
 */
const LEGACY_SLOTS = ['home-hero', 'home-footer', 'sidebar', 'lesson-aside', 'lesson-footer', 'story-footer', 'gear', 'stats']

/** The slot a name refers to, following the legacy aliases; null if none. */
export function resolveSlot(value: string): SlotName | null {
  if (value in SLOTS) {
    return value as SlotName
  }
  return LEGACY_SLOTS.includes(value) ? 'brand' : null
}

export function isSlot(value: string): value is SlotName {
  return value in SLOTS
}

export function minimumNextBid(slot: SlotName, holderAmount: number | null | undefined): number {
  const floor = SLOTS[slot].floor
  if (!holderAmount) {
    return floor
  }
  const raised = Math.max(Math.ceil(holderAmount * 1.1), holderAmount + 1_000)
  // Round up to a whole rupee.
  return Math.max(floor, Math.ceil(raised / 100) * 100)
}

/** The current holder of every slot: the largest paid bid, earliest first on a tie. */
export const HOLDERS_SQL = `
  select distinct on (slot) slot, sponsor_name as name, sponsor_url as url, image, tagline, amount, design, user_id, paid_at
  from sponsor_bids
  where status = 'paid'
  order by slot, amount desc, paid_at asc`
