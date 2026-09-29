<script setup lang="ts">
/**
 * Sign in. Only needed to write something: a story, a guestbook entry, a
 * comment, a sponsor bid. Reading the guide never needs an account.
 */
const route = useRoute()
const { user, ready, authConfigured, signInWith, signInWithEmail, signUpWithEmail } = useUser()

const next = computed(() => {
  const value = route.query.next
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/account'
})

const mode = ref<'signin' | 'signup'>('signin')
const form = reactive({ name: '', email: '', password: '' })
const busy = ref<string | null>(null)
const error = ref('')

watch([user, ready], () => {
  if (ready.value && user.value) {
    navigateTo(next.value, { replace: true })
  }
}, { immediate: true })

async function google() {
  error.value = ''
  busy.value = 'google'
  try {
    await signInWith('google', next.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Sign-in failed'
    busy.value = null
  }
}

async function submit() {
  error.value = ''
  if (!form.email || form.password.length < 8 || (mode.value === 'signup' && form.name.trim().length < 2)) {
    error.value = mode.value === 'signup'
      ? 'Your name, your email and a password of at least 8 characters.'
      : 'Your email and your password (at least 8 characters).'
    return
  }
  busy.value = 'email'
  try {
    if (mode.value === 'signup') {
      await signUpWithEmail(form.name.trim(), form.email.trim(), form.password, next.value)
    } else {
      await signInWithEmail(form.email.trim(), form.password)
    }
    if (!user.value && mode.value === 'signup') {
      error.value = 'Account created. If an email arrives asking you to confirm it, do that and then sign in here.'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Sign-in failed'
  } finally {
    busy.value = null
  }
}

useSeoMeta({
  title: 'Sign in',
  description: 'Sign in to share your story, sign the guestbook, comment on a lesson or sponsor the guide.',
  robots: 'noindex'
})
</script>

<template>
  <CommunityPage
    kicker="Sign in"
    icon="i-lucide-log-in"
    title="Sign in to write something here"
    description="Reading the guide never needs an account. You only need one to share your story, sign the guestbook, leave a comment under a lesson or sponsor the guide."
  >
    <UCard class="max-w-md">
      <UAlert
        v-if="!authConfigured"
        color="warning"
        variant="subtle"
        icon="i-lucide-construction"
        title="Sign-in is not switched on yet"
        description="I am still wiring it up. Everything else on the site works without it."
        class="mb-4"
      />

      <UButton
        block
        size="lg"
        color="neutral"
        variant="outline"
        icon="i-simple-icons-google"
        :loading="busy === 'google'"
        :disabled="!authConfigured || busy !== null"
        @click="google"
      >
        Continue with Google
      </UButton>

      <USeparator
        label="or with email"
        class="my-6"
      />

      <form
        class="space-y-4"
        @submit.prevent="submit"
      >
        <UFormField
          v-if="mode === 'signup'"
          label="Your name"
          name="name"
        >
          <UInput
            v-model="form.name"
            autocomplete="name"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Email"
          name="email"
        >
          <UInput
            v-model="form.email"
            type="email"
            autocomplete="email"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Password"
          name="password"
          :hint="mode === 'signup' ? 'At least 8 characters' : undefined"
        >
          <UInput
            v-model="form.password"
            type="password"
            :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
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
          block
          :loading="busy === 'email'"
          :disabled="!authConfigured || busy !== null"
        >
          {{ mode === 'signup' ? 'Create my account' : 'Sign in' }}
        </UButton>
      </form>

      <p class="mt-4 text-sm text-muted">
        <template v-if="mode === 'signin'">
          New here?
          <button
            type="button"
            class="text-primary font-medium"
            @click="mode = 'signup'"
          >
            Create an account
          </button>
        </template>
        <template v-else>
          Already have one?
          <button
            type="button"
            class="text-primary font-medium"
            @click="mode = 'signin'"
          >
            Sign in instead
          </button>
        </template>
      </p>
    </UCard>

    <p class="mt-6 text-sm text-muted max-w-md">
      I keep your name, your email and your picture, and only to show next to
      what you write. You can delete the account, and everything you wrote, from
      your account page at any time. The details are in the
      <NuxtLink
        to="/privacy"
        class="text-primary"
      >privacy note</NuxtLink>.
    </p>
  </CommunityPage>
</template>
