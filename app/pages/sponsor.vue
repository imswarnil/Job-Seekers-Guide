<script setup lang="ts">
/**
 * Sponsor a spot on the site, on the outbid model: pay once, keep the spot for
 * as long as nobody pays more. No monthly fee, no expiry.
 */
interface SlotInfo {
  slot: string
  label: string
  floor: number
  holder: { name: string, url: string, image: string | null, tagline: string | null, amount: number } | null
  minimumNextBid: number
}

const route = useRoute()
const { user, ready } = useUser()

const { data, status } = useFetch<{ items: SlotInfo[] }>('/api/sponsors/slots', {
  server: false,
  lazy: true,
  default: () => ({ items: [] })
})

const selected = ref<string>(typeof route.query.slot === 'string' ? route.query.slot : 'home-hero')
const current = computed(() => data.value?.items.find(s => s.slot === selected.value))

const form = reactive({ name: '', url: '', image: '', tagline: '', rupees: 0 })
const saving = ref(false)
const error = ref('')

watch(current, (slot) => {
  if (slot && form.rupees * 100 < slot.minimumNextBid) {
    form.rupees = Math.ceil(slot.minimumNextBid / 100)
  }
}, { immediate: true })

function pick(slot: string) {
  selected.value = slot
  const s = data.value?.items.find(i => i.slot === slot)
  if (s) {
    form.rupees = Math.ceil(s.minimumNextBid / 100)
  }
  document.getElementById('bid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function submit() {
  error.value = ''
  const slot = current.value
  if (!slot) {
    error.value = 'Pick a spot first.'
    return
  }
  const amount = Math.round(form.rupees * 100)
  if (amount < slot.minimumNextBid) {
    error.value = `The minimum for this spot is ${formatPaise(slot.minimumNextBid)}.`
    return
  }
  saving.value = true
  try {
    const { checkoutUrl } = await $fetch<{ checkoutUrl: string }>('/api/sponsors/bid', {
      method: 'POST',
      body: {
        slot: slot.slot,
        amount,
        name: form.name,
        url: form.url,
        image: form.image || undefined,
        tagline: form.tagline || undefined
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
  description: 'Pay once and keep a spot on the Bangalore Job Seekers Guide until somebody outbids you. Companies and individuals welcome.',
  headline: 'Sponsor'
})
</script>

<template>
  <CommunityPage
    width="wide"
    kicker="Sponsor"
    icon="i-lucide-megaphone"
    title="Put your name in front of thousands of job seekers"
    description="Pay once and the spot is yours, for as long as nobody pays more. No monthly fee and no expiry. If somebody outbids you, your name stays on the all-time leaderboard, and you can always take the spot back."
  >
    <template #actions>
      <UButton
        to="/leaderboard"
        color="neutral"
        variant="outline"
        icon="i-lucide-trophy"
      >
        See the leaderboard
      </UButton>
      <UButton
        to="/stats"
        color="neutral"
        variant="ghost"
        icon="i-lucide-chart-column"
      >
        How many people read this
      </UButton>
    </template>

    <section class="how">
      <div>
        <UIcon
          name="i-lucide-gavel"
          class="size-5 text-primary"
        />
        <p class="how__title">
          Outbid to take it
        </p>
        <p class="how__text">
          The highest single payment for a spot holds it. The next bid has to
          beat it by 10%, and by at least ₹100.
        </p>
      </div>
      <div>
        <UIcon
          name="i-lucide-infinity"
          class="size-5 text-primary"
        />
        <p class="how__title">
          Keep it forever
        </p>
        <p class="how__text">
          There is no end date. The spot is yours until somebody pays more.
        </p>
      </div>
      <div>
        <UIcon
          name="i-lucide-building-2"
          class="size-5 text-primary"
        />
        <p class="how__title">
          Companies or people
        </p>
        <p class="how__text">
          An institute, a company that hires freshers, or someone who just wants
          to say thank you. A name, a link and a line, shown as you wrote them.
        </p>
      </div>
    </section>

    <h2 class="mt-12 mb-4 text-xl font-semibold text-highlighted">
      The spots
    </h2>

    <div
      v-if="status === 'pending' || status === 'idle'"
      class="slots"
    >
      <USkeleton
        v-for="n in 6"
        :key="n"
        class="h-36"
      />
    </div>

    <div
      v-else
      class="slots"
    >
      <button
        v-for="s in data?.items"
        :key="s.slot"
        type="button"
        class="slot"
        :data-selected="s.slot === selected ? '' : undefined"
        @click="pick(s.slot)"
      >
        <span class="text-xs font-mono text-dimmed">{{ s.slot }}</span>
        <span class="font-semibold text-highlighted">{{ s.label }}</span>
        <span
          v-if="s.holder"
          class="text-sm text-muted"
        >
          Held by <span class="font-medium text-default">{{ s.holder.name }}</span> at {{ formatPaise(s.holder.amount) }}
        </span>
        <span
          v-else
          class="text-sm text-muted"
        >Nobody holds it yet</span>
        <span class="mt-auto text-sm font-semibold text-primary">
          {{ s.holder ? 'Outbid from' : 'Take it from' }} {{ formatPaise(s.minimumNextBid) }}
        </span>
      </button>
    </div>

    <UCard
      id="bid"
      class="mt-10 max-w-2xl scroll-mt-8"
    >
      <h2 class="text-lg font-semibold text-highlighted">
        Bid for <span class="font-mono text-primary">{{ selected }}</span>
      </h2>
      <p
        v-if="current"
        class="mt-1 text-sm text-muted"
      >
        The minimum right now is {{ formatPaise(current.minimumNextBid) }}. You pay
        through Dodo Payments; the spot changes hands once the payment clears.
      </p>

      <div
        v-if="!ready"
        class="mt-4"
      >
        <USkeleton class="h-24 w-full" />
      </div>

      <div
        v-else-if="!user"
        class="mt-4 flex flex-wrap items-center justify-between gap-4"
      >
        <p class="text-muted text-sm">
          Sign in to bid, so the spot and the receipt are tied to you.
        </p>
        <UButton
          :to="{ path: '/login', query: { next: `/sponsor?slot=${selected}` } }"
          icon="i-lucide-log-in"
        >
          Sign in
        </UButton>
      </div>

      <form
        v-else
        class="mt-5 space-y-4"
        @submit.prevent="submit"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Name to show"
            required
          >
            <UInput
              v-model="form.name"
              maxlength="60"
              placeholder="Your company, or you"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Link"
            required
          >
            <UInput
              v-model="form.url"
              type="url"
              placeholder="https://"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Logo or photo link"
            hint="Optional, https"
          >
            <UInput
              v-model="form.image"
              type="url"
              placeholder="https://…/logo.png"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Your bid (₹)"
            required
          >
            <UInput
              v-model.number="form.rupees"
              type="number"
              :min="current ? Math.ceil(current.minimumNextBid / 100) : 1"
              step="1"
              class="w-full"
            />
          </UFormField>
        </div>
        <UFormField
          label="One line"
          hint="Optional, up to 100 characters"
        >
          <UInput
            v-model="form.tagline"
            maxlength="100"
            placeholder="Hiring Java freshers in Bangalore"
            class="w-full"
          />
        </UFormField>

        <p
          v-if="error"
          class="text-sm text-error"
          role="alert"
        >
          {{ error }}
        </p>

        <UButton
          type="submit"
          size="lg"
          :loading="saving"
          icon="i-lucide-lock"
        >
          Pay {{ formatPaise(Math.round(form.rupees * 100)) }} and take the spot
        </UButton>
        <p class="text-xs text-muted">
          Nothing is shown until the payment clears. If somebody else outbids you
          while you are paying, your payment still counts on the leaderboard and
          I will refund it if you ask.
        </p>
      </form>
    </UCard>
  </CommunityPage>
</template>

<style scoped>
.how {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
}

.how > div {
  padding: 1.125rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-lg, 0.75rem);
}

.how__title {
  margin-top: 0.5rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.how__text {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.slots {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
}

.slot {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-height: 9rem;
  padding: 1rem 1.125rem;
  text-align: left;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-lg, 0.75rem);
  transition: border-color 150ms ease, background-color 150ms ease;
}

.slot:hover {
  border-color: var(--ui-border-accented);
}

.slot[data-selected] {
  border-color: var(--ui-primary);
  background: color-mix(in oklab, var(--ui-primary) 6%, transparent);
}
</style>
