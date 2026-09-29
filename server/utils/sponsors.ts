/**
 * The sponsor slots and their prices. Money is paise throughout.
 *
 * The outbid model: the highest single paid bid on a slot holds it, with no
 * expiry, until somebody pays more. The next bid has to beat the holder by 10%
 * (and by at least ₹100), so a slot cannot be taken for one rupee more.
 */
export const SLOTS = {
  'home-hero': { label: 'Home page, under the hero', floor: 99_900 },
  'home-footer': { label: 'Home page, at the foot', floor: 49_900 },
  'sidebar': { label: 'The guide sidebar, on every page', floor: 99_900 },
  'lesson-aside': { label: 'Beside every lesson', floor: 49_900 },
  'lesson-footer': { label: 'Under every lesson', floor: 49_900 },
  'story-footer': { label: 'Under every story', floor: 29_900 },
  'gear': { label: 'The gear page', floor: 29_900 },
  'stats': { label: 'The public stats page', floor: 29_900 }
} as const satisfies Record<string, { label: string, floor: number }>

export type SlotName = keyof typeof SLOTS
export const SLOT_NAMES = Object.keys(SLOTS) as SlotName[]

export function isSlot(value: string): value is SlotName {
  return value in SLOTS
}

export function minimumNextBid(slot: SlotName, holderAmount: number | null | undefined): number {
  const floor = SLOTS[slot].floor
  if (!holderAmount) {
    return floor
  }
  const raised = Math.max(Math.ceil(holderAmount * 1.1), holderAmount + 10_000)
  // Round up to a whole rupee.
  return Math.max(floor, Math.ceil(raised / 100) * 100)
}

/** The current holder of every slot: the largest paid bid, earliest first on a tie. */
export const HOLDERS_SQL = `
  select distinct on (slot) slot, sponsor_name as name, sponsor_url as url, image, tagline, amount, user_id, paid_at
  from sponsor_bids
  where status = 'paid'
  order by slot, amount desc, paid_at asc`
