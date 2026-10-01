<script setup lang="ts">
/**
 * Pay what you want, to keep the guide free. No account needed.
 *
 * Three amounts and a box for any other, an optional name and an optional
 * message, then Dodo's checkout (POST /api/support/checkout, amount in paise).
 * Dodo sends the reader back to /support/thanks, which asks the server whether
 * the payment really cleared.
 *
 * This is the form that used to be the whole /support page. It lives on
 * /sponsor now, beside the sponsor spot, so there is one page for backing the
 * guide.
 */
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
</script>

<template>
  <form
    class="support-form"
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
          :aria-pressed="choice === p"
          size="lg"
          class="num"
          @click="choice = p"
        >
          ₹{{ p }}
        </UButton>
        <UButton
          :variant="choice === 'custom' ? 'solid' : 'outline'"
          :color="choice === 'custom' ? 'primary' : 'neutral'"
          :aria-pressed="choice === 'custom'"
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
        aria-label="Amount in rupees"
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

    <div>
      <UButton
        type="submit"
        size="xl"
        :loading="saving"
        icon="i-lucide-heart"
      >
        Give ₹{{ rupees || 0 }}
      </UButton>
    </div>
    <p class="text-xs text-muted">
      Payments are handled by Dodo Payments: UPI, cards and more. I never see
      your card details. It is a gift, not a purchase: there is nothing to
      unlock, because everything is already free.
    </p>
  </form>
</template>

<style scoped>
.support-form {
  display: grid;
  gap: 1.25rem;
}
</style>
