<script setup lang="ts">
/**
 * Where Dodo sends people back after paying (a donation or a sponsor bid).
 * The redirect proves nothing by itself, so this page asks our server, which
 * only marks a payment paid when the signed webhook arrives. It checks a few
 * times, because the webhook and the redirect race.
 */
const route = useRoute()
const ref_ = computed(() => (typeof route.query.ref === 'string' ? route.query.ref : ''))
const kind = computed(() => (route.query.kind === 'bid' ? 'bid' : 'donation'))
const returned = computed(() => (typeof route.query.status === 'string' ? route.query.status : ''))

const state = ref<'checking' | 'paid' | 'pending' | 'failed' | 'unknown'>('checking')
const amount = ref(0)
const slot = ref<string | null>(null)

onMounted(async () => {
  if (!ref_.value) {
    state.value = 'unknown'
    return
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const result = await $fetch<{ status: string, amount?: number, slot?: string | null }>(`/api/payments/${ref_.value}`)
      amount.value = result.amount || 0
      slot.value = result.slot || null
      if (result.status === 'paid') {
        state.value = 'paid'
        return
      }
      if (result.status === 'failed' || result.status === 'cancelled') {
        state.value = 'failed'
        return
      }
      if (result.status === 'unknown') {
        state.value = 'unknown'
        return
      }
    } catch {
      // Try again below.
    }
    state.value = 'pending'
    await new Promise(resolve => setTimeout(resolve, 1500 + attempt * 500))
  }
  if (returned.value === 'failed') {
    state.value = 'failed'
  }
})

useSeoMeta({ title: 'Thank you', robots: 'noindex' })
</script>

<template>
  <CommunityPage
    kicker="Thank you"
    icon="i-lucide-heart"
    :title="state === 'failed' ? 'The payment did not go through' : 'Thank you'"
  >
    <div class="panel">
      <div
        v-if="state === 'checking'"
        class="flex items-center gap-3 text-muted"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-5 animate-spin"
        />
        Checking the payment…
      </div>

      <template v-else-if="state === 'paid'">
        <p
          v-if="kind === 'bid'"
          class="text-lg text-highlighted"
        >
          Your {{ formatPaise(amount) }} bid is in<template v-if="slot">
            for <span class="font-mono text-primary">{{ slot }}</span>
          </template>. If it is still the highest, your spot is live now.
        </p>
        <p
          v-else
          class="text-lg text-highlighted"
        >
          {{ formatPaise(amount) }} received. It keeps the guide online for the
          next person who gets off a train with nothing but a plan. Thank you.
        </p>
      </template>

      <p
        v-else-if="state === 'pending'"
        class="text-highlighted"
      >
        The payment is still being confirmed. That can take a minute; you will
        get a receipt from Dodo Payments by email either way. You do not need to
        stay on this page.
      </p>

      <p
        v-else-if="state === 'failed'"
        class="text-highlighted"
      >
        Nothing was charged. If money did leave your account, it will come back
        on its own within a few days; if it does not, write to me from the
        contact page.
      </p>

      <p
        v-else
        class="text-highlighted"
      >
        I could not find that payment. If you did pay, the receipt from Dodo
        Payments is the proof, and the contact page reaches me.
      </p>

      <div class="mt-6 flex flex-wrap gap-2">
        <UButton
          v-if="kind === 'bid'"
          to="/leaderboard"
          icon="i-lucide-trophy"
        >
          See the leaderboard
        </UButton>
        <UButton
          v-if="state === 'failed'"
          :to="kind === 'bid' ? '/sponsor' : '/support'"
          icon="i-lucide-rotate-ccw"
        >
          Try again
        </UButton>
        <UButton
          to="/"
          color="neutral"
          variant="outline"
          icon="i-lucide-house"
        >
          Back to the guide
        </UButton>
      </div>
    </div>
  </CommunityPage>
</template>
