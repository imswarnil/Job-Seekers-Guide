<script setup lang="ts">
import type { SponsorDraft, SponsorDesignOptions } from '~/components/SponsorDesigner.vue'
import type { SponsorCardDesign } from '~/components/SponsorCard.vue'
import { draftProblems } from '~/components/SponsorDesigner.vue'

/**
 * Sponsors and supporters: the one page for the people who pay for this guide
 * and for joining them. Three pages became this one; `/leaderboard` and
 * `/support` now redirect to its sections (middleware/legacy.global.ts).
 *
 *   #leaderboard  everybody who has sponsored, ranked: the first three on a
 *                 podium, the rest as a list (SponsorPodium).
 *   #support      pay what you want, once, no account (SupportForm, which
 *                 posts to /api/support/checkout).
 *   #sponsor      the site's one spot, on the outbid model: pay once, keep it
 *                 for as long as nobody pays more. No monthly fee, no expiry.
 *                 Whoever holds it is the site sponsor, shown across the site.
 *
 * The sponsor designs their card here first (SponsorDesigner, previewed with
 * the real SponsorCard in both shapes), then bids and pays through Dodo. The
 * design travels with the bid and is checked by the server against the same
 * lists the designer offers (GET /api/sponsors/design).
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

// ---- The draft, kept in this browser so signing in halfway loses nothing ----
const DRAFT_KEY = 'jsg-sponsor-draft'
const draft = ref<SponsorDraft>({ type: 'company', name: '', url: '', tagline: '', image: '', layout: 'logo-left', palette: 'ink', cta: null })

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
    if (saved && typeof saved === 'object') {
      for (const key of ['type', 'name', 'url', 'tagline', 'image', 'layout', 'palette'] as const) {
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
        design: { type: d.type, layout: d.layout, palette: d.palette, cta: d.cta }
      }
    })
    window.location.href = checkoutUrl
  } catch (e) {
    error.value = apiError(e)
    saving.value = false
  }
}

/** The outbid model, in three lines. */
const steps = [
  { title: 'Outbid to take it', text: 'The highest single payment holds the spot. The next bid has to beat it by 10%, and by at least ₹10.' },
  { title: 'Keep it with no end date', text: 'There is no monthly fee and no expiry. The spot is yours until somebody pays more.' },
  { title: 'Companies or people', text: 'An institute, a company that hires freshers, or someone who wants to say thank you. Your card, shown as you designed it.' }
]

/** Where the site sponsor shows, by shape. The same two shapes the designer previews. */
const placements = [
  { format: 'Leaderboard', where: 'A full-width strip on the home page, and at the top of Stories, the Guestbook, Stats and the Leaderboard' },
  { format: 'Square', where: 'A compact card beside every lesson, which stays in view as the reader scrolls, and in the sidebar on every page' }
]

usePageSeo({
  title: 'Sponsors and supporters',
  description: 'Everybody who has paid to keep the Bangalore Job Seekers Guide free, ranked, and the two ways to join them: give any amount, once, or design a card and hold the site sponsor spot until somebody outbids you.',
  headline: 'Sponsors'
})
</script>

<template>
  <div class="sponsor-page">
    <!-- Head ------------------------------------------------------------------- -->
    <header class="band guides sponsor-page__head">
      <div class="frame swiss-grid">
        <div class="col-span-full lg:col-span-9">
          <p class="label">
            <span class="mark" />
            Sponsors and supporters
          </p>
          <h1 class="display mt-4">
            Back this guide
          </h1>
          <p class="lede mt-5">
            Everything here is free to read, and it stays free. These are the
            people and companies who pay for that, and the two ways to join
            them: give any amount, once, or put your name in front of every
            reader as the site sponsor.
          </p>
          <div class="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <NuxtLink
              to="#support"
              class="arrow-link"
            >
              Give any amount
              <UIcon name="i-lucide-arrow-down" />
            </NuxtLink>
            <NuxtLink
              to="#sponsor"
              class="arrow-link"
            >
              Become the site sponsor
              <UIcon name="i-lucide-arrow-down" />
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

    <!-- The leaderboard: the podium, then everybody else ---------------------------- -->
    <section
      id="leaderboard"
      class="band guides scroll-mt-8"
      aria-labelledby="leaderboard-title"
    >
      <div class="frame">
        <div class="swiss-grid mb-10">
          <div class="col-span-full lg:col-span-8">
            <p class="label">
              <UIcon
                name="i-lucide-trophy"
                class="size-3.5"
              />
              Leaderboard
            </p>
            <h2
              id="leaderboard-title"
              class="headline mt-2"
            >
              Sponsors of all time
            </h2>
            <p class="mt-3 text-muted max-w-2xl">
              Ranked by everything they have put in. The sponsor spot can be
              outbid. A place on this list cannot.
            </p>
          </div>
        </div>

        <!-- The card the site is showing now, when somebody holds the spot. -->
        <SponsorSlot
          name="brand"
          format="leaderboard"
          hide-empty
          class="mb-12"
        />

        <SponsorPodium />
      </div>
    </section>

    <!-- The two ways to join, side by side ----------------------------------------- -->
    <section
      class="band guides"
      aria-label="Two ways to back the guide"
    >
      <div class="frame swiss-grid gap-y-12">
        <!-- Way one: support -->
        <div
          id="support"
          class="way col-span-full lg:col-span-6 scroll-mt-8"
        >
          <p class="label">
            <span class="way__n num">01</span>
            Support
          </p>
          <h2 class="headline mt-3">
            Pay what you want
          </h2>
          <p class="way__text">
            I paid for the institute, the PG and the train out of savings and
            my sister's faith. If this guide saved you a coaching fee, or a few
            bad weeks, a small amount keeps it online and keeps me writing.
          </p>

          <SupportForm class="mt-6" />

          <p class="way__aside">
            No money? That is fine.
            <NuxtLink
              to="/guestbook"
              class="way__inline"
            >Sign the guestbook</NuxtLink>
            or
            <NuxtLink
              to="/stories/new"
              class="way__inline"
            >share your story</NuxtLink>.
            It helps more than you think.
          </p>
        </div>

        <!-- Way two: sponsor -->
        <div
          id="sponsor"
          class="way col-span-full lg:col-span-6 scroll-mt-8"
        >
          <p class="label">
            <span class="way__n num">02</span>
            Sponsor
          </p>
          <h2 class="headline mt-3">
            Design your card and bid for the spot
          </h2>
          <p class="way__text">
            There is one sponsor spot. Whoever holds it is the site sponsor:
            their card sits on the home page, beside every lesson, in the
            sidebar and at the top of the community pages. If somebody outbids
            you, your name stays on the leaderboard, and you can always take
            the spot back.
          </p>

          <div class="mt-6">
            <USkeleton
              v-if="status === 'pending' || status === 'idle'"
              class="h-24 w-full"
            />
            <dl
              v-else
              class="facts"
            >
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
          </div>

          <ul class="row-list mt-6 text-sm">
            <li
              v-for="place in placements"
              :key="place.format"
              class="py-3 flex gap-4"
            >
              <span class="label w-24 shrink-0 pt-0.5">{{ place.format }}</span>
              <span class="text-muted">{{ place.where }}</span>
            </li>
          </ul>

          <div class="mt-6">
            <UButton
              to="#design"
              size="xl"
              icon="i-lucide-pencil-ruler"
            >
              Design your card
            </UButton>
          </div>
          <p class="mt-4 text-xs text-muted">
            One card, drawn in two standard shapes from the same design. Every
            one is marked "Site sponsor", and the link is marked as sponsored
            for search engines.
          </p>
        </div>
      </div>
    </section>

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
          How the sponsor spot works
        </h2>
        <div
          v-for="(step, i) in steps"
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
              First say who you are: a creator, a builder or a company. Then
              your name, your link, one line and a logo, in one of four
              layouts and one of six colours. The previews are the card the
              site will show, as the leaderboard strip and as the square, in
              light and dark.
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
/* The head is a short introduction; the board and the two ways are the page. */
.sponsor-page__head {
  padding-bottom: 2.5rem;
}

/* One of the two ways: a column under a heavy rule. */
.way {
  min-width: 0;
  padding-top: 0.875rem;
  border-top: 2px solid var(--rule-strong);
}

.way__n {
  color: var(--ui-primary);
}

.way__text {
  margin-top: 0.75rem;
  max-width: 34rem;
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.way__aside {
  margin-top: 1.5rem;
  padding-top: 0.875rem;
  border-top: 1px solid var(--rule-color);
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
}

.way__inline {
  color: var(--ui-text-highlighted);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.way__inline:hover {
  color: var(--ui-primary);
}

/* The outbid model, as three columns under heavy rules. */
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
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: var(--gutter);
}

.facts > div {
  padding-top: 0.75rem;
  border-top: 1px solid var(--rule-color);
}

.facts__value {
  margin-top: 0.5rem;
  font-size: 1.375rem;
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
