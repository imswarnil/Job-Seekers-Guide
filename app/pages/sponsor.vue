<script setup lang="ts">
import type { SponsorDraft, SponsorDesignOptions } from '~/components/SponsorDesigner.vue'
import type { SponsorCardData, SponsorCardDesign } from '~/components/SponsorCard.vue'
import { draftProblems } from '~/components/SponsorDesigner.vue'

/**
 * Sponsor the site's one spot, on the outbid model: pay once, keep it for as
 * long as nobody pays more. No monthly fee, no expiry.
 *
 * The sponsor designs their card here first (SponsorDesigner, previewed with
 * the real SponsorCard), then bids and pays through Dodo. The design travels
 * with the bid and is checked by the server against the same lists the
 * designer offers (GET /api/sponsors/design).
 *
 * An old link that still says `?slot=sidebar` lands here and bids on `brand`,
 * which is what the server does with the old names too.
 */
interface SlotInfo {
  slot: string
  label: string
  floor: number
  holder: { name: string, url: string, image: string | null, tagline: string | null, amount: number, design: SponsorCardDesign } | null
  minimumNextBid: number
}

const { user, ready } = useUser()

const { data, status } = useFetch<{ items: SlotInfo[] }>('/api/sponsors/slots', {
  server: false,
  lazy: true,
  default: () => ({ items: [] })
})

const { data: options, status: optionsStatus, refresh: reloadOptions } = useFetch<SponsorDesignOptions>('/api/sponsors/design', {
  server: false,
  lazy: true
})

const current = computed(() => data.value?.items.find(s => s.slot === 'brand') || data.value?.items[0])
const holderCard = computed<SponsorCardData | null>(() => {
  const h = current.value?.holder
  return h ? { name: h.name, url: h.url, image: h.image, tagline: h.tagline, design: h.design } : null
})

// ---- The draft, kept in this browser so signing in halfway loses nothing ----
const DRAFT_KEY = 'jsg-sponsor-draft'
const draft = ref<SponsorDraft>({ name: '', url: '', tagline: '', image: '', layout: 'logo-left', palette: 'ink', cta: null })

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
    if (saved && typeof saved === 'object') {
      for (const key of ['name', 'url', 'tagline', 'image', 'layout', 'palette'] as const) {
        if (typeof saved[key] === 'string') {
          draft.value[key] = saved[key].slice(0, 500)
        }
      }
      draft.value.cta = typeof saved.cta === 'string' ? saved.cta : null
    }
  } catch {
    // No storage (private window, blocked): the designer still works, it just forgets.
  }
})

watch(draft, (value) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(value))
  } catch {
    // As above.
  }
}, { deep: true })

// ---- The bid ----------------------------------------------------------------
const rupees = ref(0)
const saving = ref(false)
const error = ref('')
const attempted = ref(false)

watch(current, (slot) => {
  if (slot && rupees.value * 100 < slot.minimumNextBid) {
    rupees.value = Math.ceil(slot.minimumNextBid / 100)
  }
}, { immediate: true })

const problems = computed(() => draftProblems(draft.value, options.value))

async function submit() {
  error.value = ''
  attempted.value = true
  const slot = current.value
  if (!slot) {
    error.value = 'The spot has not loaded yet. Try again in a moment.'
    return
  }
  if (Object.keys(problems.value).length) {
    error.value = 'A field in the card above needs fixing first.'
    return
  }
  const amount = Math.round(rupees.value * 100)
  if (!Number.isFinite(amount) || amount < slot.minimumNextBid) {
    error.value = `The minimum for this spot is ${formatPaise(slot.minimumNextBid)}.`
    return
  }
  saving.value = true
  try {
    const d = draft.value
    const { checkoutUrl } = await $fetch<{ checkoutUrl: string }>('/api/sponsors/bid', {
      method: 'POST',
      body: {
        slot: slot.slot,
        amount,
        name: d.name.trim(),
        url: d.url.trim(),
        image: d.image.trim() || undefined,
        tagline: d.tagline.trim() || undefined,
        design: { layout: d.layout, palette: d.palette, cta: d.cta }
      }
    })
    window.location.href = checkoutUrl
  } catch (e) {
    error.value = apiError(e)
    saving.value = false
  }
}

usePageSeo({
  title: 'Sponsor the guide',
  description: 'Design your card, pay once and keep the spot on the Bangalore Job Seekers Guide until somebody outbids you. Companies and individuals welcome.',
  headline: 'Sponsor'
})
</script>

<template>
  <div class="sponsor-page">
    <!-- Head ------------------------------------------------------------------- -->
    <header class="band guides">
      <div class="frame swiss-grid">
        <div class="col-span-full lg:col-span-9">
          <p class="label">
            <span class="mark" />
            Sponsor
          </p>
          <h1 class="display mt-4">
            Put your name in front of thousands of job seekers
          </h1>
          <p class="lede mt-5">
            Design your card, pay once, and the spot is yours for as long as
            nobody pays more. No monthly fee and no expiry. If somebody outbids
            you, your name stays on the all-time leaderboard, and you can always
            take the spot back.
          </p>
          <div class="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <NuxtLink
              to="#design"
              class="arrow-link"
            >
              Design your card
              <UIcon name="i-lucide-arrow-down" />
            </NuxtLink>
            <NuxtLink
              to="/leaderboard"
              class="arrow-link"
            >
              The leaderboard
              <UIcon name="i-lucide-arrow-right" />
            </NuxtLink>
            <NuxtLink
              to="/stats"
              class="arrow-link"
            >
              How many people read this
              <UIcon name="i-lucide-arrow-right" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- How it works ------------------------------------------------------------ -->
    <section
      class="band guides"
      aria-labelledby="how-title"
    >
      <div class="frame swiss-grid gap-y-8">
        <h2
          id="how-title"
          class="label col-span-full"
        >
          How it works
        </h2>
        <div
          v-for="(step, i) in [
            { title: 'Outbid to take it', text: 'The highest single payment holds the spot. The next bid has to beat it by 10%, and by at least ₹100.' },
            { title: 'Keep it forever', text: 'There is no end date. The spot is yours until somebody pays more.' },
            { title: 'Companies or people', text: 'An institute, a company that hires freshers, or someone who wants to say thank you. Your card, shown as you designed it.' }
          ]"
          :key="step.title"
          class="step col-span-full sm:col-span-4"
        >
          <span class="step__n num">0{{ i + 1 }}</span>
          <p class="step__title">
            {{ step.title }}
          </p>
          <p class="step__text">
            {{ step.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- The spot ---------------------------------------------------------------- -->
    <section
      class="band guides"
      aria-labelledby="spot-title"
    >
      <div class="frame swiss-grid gap-y-6">
        <div class="col-span-full lg:col-span-4">
          <h2
            id="spot-title"
            class="headline"
          >
            The spot
          </h2>
          <ul class="row-list mt-5 text-sm">
            <li class="py-2.5 flex gap-3">
              <span class="label w-16 shrink-0">Home</span>
              A band on the home page, under my journey
            </li>
            <li class="py-2.5 flex gap-3">
              <span class="label w-16 shrink-0">Lessons</span>
              The card beside every lesson, which stays in view as the reader scrolls
            </li>
          </ul>
        </div>

        <div class="col-span-full lg:col-span-7 lg:col-start-6">
          <USkeleton
            v-if="status === 'pending' || status === 'idle'"
            class="h-32 w-full"
          />
          <template v-else>
            <dl class="facts">
              <div>
                <dt class="label">
                  Held by
                </dt>
                <dd class="facts__value">
                  {{ current?.holder?.name || 'Nobody yet' }}
                </dd>
              </div>
              <div v-if="current?.holder">
                <dt class="label">
                  At
                </dt>
                <dd class="facts__value num">
                  {{ formatPaise(current.holder.amount) }}
                </dd>
              </div>
              <div>
                <dt class="label">
                  {{ current?.holder ? 'Outbid from' : 'Take it from' }}
                </dt>
                <dd class="facts__value facts__value--accent num">
                  {{ current ? formatPaise(current.minimumNextBid) : '–' }}
                </dd>
              </div>
            </dl>
            <div
              v-if="holderCard"
              class="mt-6"
            >
              <p class="label mb-2">
                On the site now
              </p>
              <SponsorCard
                :sponsor="holderCard"
                size="band"
              />
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- The designer ------------------------------------------------------------ -->
    <section
      id="design"
      class="band guides scroll-mt-8"
      aria-labelledby="design-title"
    >
      <div class="frame">
        <div class="swiss-grid mb-8">
          <div class="col-span-full lg:col-span-8">
            <p class="label">
              Step one
            </p>
            <h2
              id="design-title"
              class="headline mt-2"
            >
              Design your card
            </h2>
            <p class="lede mt-3">
              Your name, your link, one line and a logo, in one of four layouts
              and one of six colours. The preview is the card the site will
              show, on the home page and beside every lesson, in light and dark.
            </p>
          </div>
        </div>

        <SponsorDesigner
          v-if="options"
          v-model="draft"
          :options="options"
          :can-upload="Boolean(user)"
          :show-problems="attempted"
        />
        <USkeleton
          v-else-if="optionsStatus === 'pending' || optionsStatus === 'idle'"
          class="h-96 w-full"
        />
        <p
          v-else
          class="text-sm text-muted"
        >
          The designer could not load just now.
          <button
            type="button"
            class="text-primary font-medium"
            @click="reloadOptions()"
          >
            Try again
          </button>
        </p>
      </div>
    </section>

    <!-- The bid ----------------------------------------------------------------- -->
    <section
      id="bid"
      class="band guides scroll-mt-8"
      aria-labelledby="bid-title"
    >
      <div class="frame swiss-grid gap-y-6">
        <div class="col-span-full lg:col-span-4">
          <p class="label">
            Step two
          </p>
          <h2
            id="bid-title"
            class="headline mt-2"
          >
            Bid and pay
          </h2>
          <p
            v-if="current"
            class="mt-3 text-sm text-muted"
          >
            The minimum right now is <span class="num font-semibold text-highlighted">{{ formatPaise(current.minimumNextBid) }}</span>.
            You pay through Dodo Payments; the spot changes hands once the
            payment clears.
          </p>
        </div>

        <div class="col-span-full lg:col-span-7 lg:col-start-6">
          <USkeleton
            v-if="!ready"
            class="h-24 w-full"
          />

          <div
            v-else-if="!user"
            class="signin rule-strong"
          >
            <p class="text-sm text-muted">
              Sign in to bid, so the spot and the receipt are tied to you. Your
              card design is kept in this browser while you do.
            </p>
            <UButton
              :to="{ path: '/login', query: { next: '/sponsor#bid' } }"
              icon="i-lucide-log-in"
            >
              Sign in to bid
            </UButton>
          </div>

          <form
            v-else
            class="bidform rule-strong"
            @submit.prevent="submit"
          >
            <UFormField
              label="Your bid, in rupees"
              required
            >
              <UInput
                v-model.number="rupees"
                type="number"
                :min="current ? Math.ceil(current.minimumNextBid / 100) : 1"
                step="1"
                size="xl"
                class="w-full max-w-xs num"
              />
            </UFormField>

            <p
              v-if="error"
              class="text-sm text-error"
              role="alert"
            >
              {{ error }}
            </p>

            <div>
              <UButton
                type="submit"
                size="xl"
                :loading="saving"
                icon="i-lucide-lock"
              >
                Pay {{ formatPaise(Math.round((rupees || 0) * 100)) }} and take the spot
              </UButton>
            </div>
            <p class="text-xs text-muted">
              Nothing is shown until the payment clears. If somebody else outbids
              you while you are paying, your payment still counts on the
              leaderboard and I will refund it if you ask. I can take a card down
              if it breaks the site's rules, and I will refund you if I do.
            </p>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.step {
  padding-top: 0.75rem;
  border-top: 2px solid var(--rule-strong);
}

.step__n {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ui-primary);
}

.step__title {
  margin-top: 0.75rem;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
}

.step__text {
  margin-top: 0.375rem;
  font-size: 0.9375rem;
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--gutter);
}

.facts > div {
  padding-top: 0.75rem;
  border-top: 2px solid var(--rule-strong);
}

.facts__value {
  margin-top: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ui-text-highlighted);
  overflow-wrap: anywhere;
}

.facts__value--accent {
  color: var(--ui-primary);
}

.signin,
.bidform {
  display: grid;
  gap: 1.25rem;
  padding-top: 1.25rem;
}
</style>
