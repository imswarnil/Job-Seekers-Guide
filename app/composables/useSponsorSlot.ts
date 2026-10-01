import type { SponsorCardData, SponsorCardDesign } from '~/components/SponsorCard.vue'

/**
 * The holder of a sponsor slot, fetched once and shared.
 *
 * The site sponsor now shows in several places at the same time (the strip at
 * the top of a page, the square beside a lesson, the square in the sidebar),
 * and each of them is a `SponsorSlot`. Without this they would each ask the
 * server the same question on every page. One answer is kept per slot name,
 * every slot on the page reads it, and it is asked again when it is more than
 * a minute old, so a reader who keeps the tab open sees a new holder without
 * reloading.
 *
 * Browser only, on purpose. Every page is prerendered, and a holder baked into
 * the HTML would stay there after they were outbid. `load()` is called from
 * `onMounted`; on the server nothing is ever fetched or stored.
 */
interface Holder {
  name: string
  url: string
  image?: string | null
  tagline?: string | null
  amount?: number
  design?: SponsorCardDesign
}

interface SlotResponse {
  slot: string
  holder: Holder | null
  minimumNextBid?: number
}

interface Entry {
  at: number
  data: SlotResponse | null
}

const FRESH_FOR = 60_000
const inflight = new Map<string, Promise<void>>()

const DEFAULT_DESIGN: SponsorCardDesign = { layout: 'logo-left', accent: '#111111', ink: '#FFFFFF', cta: null }

/** Only a plain web link is ever a destination, whatever a bidder typed in. */
const isWeb = (value?: string | null) => Boolean(value && /^https?:\/\//i.test(value))

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export function useSponsorSlot(name: MaybeRefOrGetter<string> = 'brand') {
  const store = useState<Record<string, Entry>>('sponsor-slots', () => ({}))
  const key = computed(() => toValue(name) || 'brand')
  const entry = computed(() => store.value[key.value])

  /** False until the first answer (or the first failure) has come back. */
  const loaded = computed(() => Boolean(entry.value))

  const holder = computed<SponsorCardData | null>(() => {
    const h = entry.value?.data?.holder
    if (!h || !h.name || !isWeb(h.url)) {
      return null
    }
    return { name: h.name, url: h.url, image: h.image ?? null, tagline: h.tagline ?? null, design: h.design ?? DEFAULT_DESIGN }
  })

  /** The least the next bid can be, as "₹2,900". Money arrives in paise. */
  const price = computed(() => {
    const paise = entry.value?.data?.minimumNextBid
    return typeof paise === 'number' && paise > 0 ? inr.format(paise / 100) : undefined
  })

  function load(): Promise<void> {
    if (import.meta.server) {
      return Promise.resolve()
    }
    const slot = key.value
    const known = store.value[slot]
    if (known && Date.now() - known.at < FRESH_FOR) {
      return Promise.resolve()
    }
    const running = inflight.get(slot)
    if (running) {
      return running
    }
    const request = $fetch<SlotResponse>(`/api/sponsors/slot/${encodeURIComponent(slot)}`, { timeout: 6000 })
      .then((data) => {
        store.value = { ...store.value, [slot]: { at: Date.now(), data } }
      })
      .catch(() => {
        // A failed request loses the price, never the invitation. Keep the
        // last good answer if there was one.
        store.value = { ...store.value, [slot]: { at: Date.now(), data: known?.data ?? null } }
      })
      .finally(() => {
        inflight.delete(slot)
      })
    inflight.set(slot, request)
    return request
  }

  return { holder, price, loaded, load }
}
