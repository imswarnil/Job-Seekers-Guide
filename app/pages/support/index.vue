<script setup lang="ts">
/** Give any amount to keep the guide free. No account needed. */
const presets = [99, 299, 999]
const { user } = useUser()

const choice = ref<number | 'custom'>(299)
const custom = ref<number | null>(null)
const name = ref('')
const message = ref('')
const saving = ref(false)
const error = ref('')

const rupees = computed(() => (choice.value === 'custom' ? Number(custom.value || 0) : choice.value))

watch(user, (u) => {
  if (u && !name.value) {
    name.value = u.name
  }
}, { immediate: true })

async function give() {
  error.value = ''
  if (!Number.isFinite(rupees.value) || rupees.value < 10) {
    error.value = 'The smallest amount is ₹10.'
    return
  }
  saving.value = true
  try {
    const { checkoutUrl } = await $fetch<{ checkoutUrl: string }>('/api/support/checkout', {
      method: 'POST',
      body: {
        amount: Math.round(rupees.value * 100),
        name: name.value || undefined,
        message: message.value || undefined
      }
    })
    window.location.href = checkoutUrl
  } catch (e) {
    error.value = apiError(e)
    saving.value = false
  }
}

usePageSeo({
  title: 'Support the guide',
  description: 'The Bangalore Job Seekers Guide is free and stays free. Give any amount to keep it online for the next person.',
  headline: 'Support'
})
</script>

<template>
  <CommunityPage
    kicker="Support"
    icon="i-lucide-heart-handshake"
    title="Keep it free for the next person"
    description="I paid for the institute, the PG and the train out of savings and my sister's faith. This guide costs nothing to read and it never will. If it saved you a coaching fee, or just a few bad weeks, a small amount keeps it online and keeps me writing."
  >
    <div class="panel">
      <form
        class="space-y-5"
        @submit.prevent="give"
      >
        <div>
          <p class="text-sm font-medium text-highlighted mb-2">
            How much
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="p in presets"
              :key="p"
              :variant="choice === p ? 'solid' : 'outline'"
              :color="choice === p ? 'primary' : 'neutral'"
              size="lg"
              @click="choice = p"
            >
              ₹{{ p }}
            </UButton>
            <UButton
              :variant="choice === 'custom' ? 'solid' : 'outline'"
              :color="choice === 'custom' ? 'primary' : 'neutral'"
              size="lg"
              @click="choice = 'custom'"
            >
              Another amount
            </UButton>
          </div>
          <UInput
            v-if="choice === 'custom'"
            v-model.number="custom"
            type="number"
            min="10"
            step="1"
            placeholder="Amount in ₹"
            icon="i-lucide-indian-rupee"
            class="mt-3 w-48"
            autofocus
          />
        </div>

        <UFormField
          label="Your name"
          hint="Optional"
        >
          <UInput
            v-model="name"
            maxlength="60"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="A message for me"
          hint="Optional"
        >
          <UTextarea
            v-model="message"
            :rows="3"
            maxlength="280"
            autoresize
            placeholder="Cleared the TCS written round last week."
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
          size="xl"
          :loading="saving"
          icon="i-lucide-heart"
        >
          Give ₹{{ rupees || 0 }}
        </UButton>
        <p class="text-xs text-muted">
          Payments are handled by Dodo Payments: UPI, cards and more. I never
          see your card details. It is a gift, not a purchase: there is nothing
          to unlock, because everything is already free.
        </p>
      </form>
    </div>

    <div class="mt-10 grid gap-4 sm:grid-cols-2">
      <div class="panel">
        <p class="font-semibold text-highlighted">
          Sponsor instead
        </p>
        <p class="mt-1 text-sm text-muted">
          Put your name or your company on the site, and keep the spot until
          somebody outbids you.
        </p>
        <UButton
          to="/sponsor"
          class="mt-3"
          color="neutral"
          variant="outline"
          icon="i-lucide-megaphone"
        >
          See the spots
        </UButton>
      </div>
      <div class="panel">
        <p class="font-semibold text-highlighted">
          No money? That is fine
        </p>
        <p class="mt-1 text-sm text-muted">
          Sign the guestbook or share your story. It helps more than you think.
        </p>
        <UButton
          to="/guestbook"
          class="mt-3"
          color="neutral"
          variant="outline"
          icon="i-lucide-book-open-text"
        >
          Sign the guestbook
        </UButton>
      </div>
    </div>
  </CommunityPage>
</template>
