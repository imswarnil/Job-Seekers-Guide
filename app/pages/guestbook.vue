<script setup lang="ts">
import type { GuestbookEntry } from '~/components/GuestbookNote.vue'

/**
 * The guestbook, drawn as a wall of notes. Say hello, add a GIF, tell me one
 * thing you learned here, and, if you want, attach a small tip. Reading needs
 * nothing; signing needs an account (it is how I keep spam out).
 *
 * A signing with a tip goes through Dodo first: the note is created hidden
 * and appears on the wall once the payment clears (the webhook reveals it).
 * Coming back from the checkout lands on `/guestbook?thanks=1`.
 */
const { user, ready } = useUser()
const route = useRoute()

const { data, status } = useFetch<{ items: GuestbookEntry[] }>('/api/guestbook', {
  server: false,
  lazy: true,
  default: () => ({ items: [] })
})

const form = reactive({ name: '', message: '', learned: '', gif: null as string | null })
const saving = ref(false)
const error = ref('')
const done = ref(false)

/** Back from a tip checkout: a quiet line, no banner. */
const thanked = computed(() => route.query.thanks === '1')

// ---- The tip -----------------------------------------------------------------
const TIPS = [4_900, 9_900, 19_900] as const
const tip = ref(0)
const customTip = ref<number | null>(null)
const customOn = ref(false)

function pickTip(paise: number) {
  customOn.value = false
  customTip.value = null
  tip.value = tip.value === paise ? 0 : paise
}

function pickCustom() {
  customOn.value = true
  tip.value = 0
}

const tipAmount = computed(() => {
  if (customOn.value) {
    const rupees = customTip.value
    return rupees && Number.isFinite(rupees) ? Math.round(rupees * 100) : 0
  }
  return tip.value
})

watch(user, (u) => {
  if (u && !form.name) {
    form.name = u.name
  }
}, { immediate: true })

async function submit() {
  error.value = ''
  if (form.message.trim().length < 2) {
    error.value = 'Write a few words first.'
    return
  }
  if (customOn.value && tipAmount.value > 0 && tipAmount.value < 1_000) {
    error.value = 'The smallest tip is ₹10.'
    return
  }
  saving.value = true
  try {
    const body = {
      name: form.name || undefined,
      message: form.message,
      learned: form.learned || undefined,
      gif: form.gif || undefined
    }
    if (tipAmount.value >= 1_000) {
      // The note is created hidden; Dodo takes over, and the webhook shows it.
      const { checkoutUrl } = await $fetch<{ checkoutUrl: string }>('/api/guestbook/tip', {
        method: 'POST',
        body: { ...body, amount: tipAmount.value }
      })
      window.location.href = checkoutUrl
      return
    }
    const entry = await $fetch<GuestbookEntry>('/api/guestbook', { method: 'POST', body })
    data.value = { items: [entry, ...(data.value?.items || [])] }
    form.message = ''
    form.learned = ''
    form.gif = null
    done.value = true
  } catch (e) {
    error.value = apiError(e)
  } finally {
    saving.value = false
  }
}

usePageSeo({
  title: 'The guestbook',
  description: 'Say hello, add a GIF, and tell me one thing you learned from the guide.',
  headline: 'Guestbook'
})
</script>

<template>
  <CommunityPage
    kicker="Guestbook"
    icon="i-lucide-book-open-text"
    title="Sign the guestbook"
    description="If the guide helped you, even a little, leave a line here. Tell me one thing you learned. I read every one of these, and on bad days they are the reason I keep writing."
    width="wide"
  >
    <section
      class="gb-form"
      aria-label="Sign the guestbook"
    >
      <p
        v-if="thanked"
        class="text-sm text-success mb-4"
        role="status"
      >
        Thank you for the tip. Your note goes up on the wall the moment the
        payment clears, usually within a minute.
      </p>

      <!-- Who is signed in is only known in the browser, so all of this is
           drawn there: the prerendered page carries the placeholder. -->
      <ClientOnly>
        <template #fallback>
          <USkeleton class="h-32 w-full" />
        </template>
        <template v-if="!ready">
          <USkeleton class="h-32 w-full" />
        </template>

        <div
          v-else-if="!user"
          class="flex flex-wrap items-center justify-between gap-4"
        >
          <p class="text-muted">
            Sign in to write in the guestbook. It keeps the spam out.
          </p>
          <UButton
            :to="{ path: '/login', query: { next: route.fullPath } }"
            icon="i-lucide-log-in"
          >
            Sign in
          </UButton>
        </div>

        <form
          v-else
          class="gb-fields"
          @submit.prevent="submit"
        >
          <div class="space-y-4">
            <UFormField label="Your name">
              <UInput
                v-model="form.name"
                maxlength="60"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Your message"
              required
            >
              <UTextarea
                v-model="form.message"
                :rows="3"
                maxlength="500"
                autoresize
                placeholder="Hello from a PG in Marathahalli…"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="What did you learn here?"
              hint="Optional"
            >
              <UTextarea
                v-model="form.learned"
                :rows="2"
                maxlength="500"
                autoresize
                placeholder="That a walk-in is a numbers game, and how to read the aptitude round against a clock."
                class="w-full"
              />
            </UFormField>
            <GifPicker v-model="form.gif" />
          </div>

          <div class="space-y-4">
            <UFormField
              label="Add a tip"
              hint="Optional"
            >
              <div class="tips">
                <button
                  v-for="t in TIPS"
                  :key="t"
                  type="button"
                  class="tips__pick num"
                  :aria-pressed="!customOn && tip === t"
                  @click="pickTip(t)"
                >
                  {{ formatPaise(t) }}
                </button>
                <button
                  type="button"
                  class="tips__pick"
                  :aria-pressed="customOn"
                  @click="pickCustom"
                >
                  Custom
                </button>
                <UInput
                  v-if="customOn"
                  v-model.number="customTip"
                  type="number"
                  min="10"
                  step="1"
                  placeholder="₹"
                  class="w-24 num"
                  aria-label="Tip amount in rupees"
                />
              </div>
              <p class="mt-2 text-xs text-muted">
                A tip goes through Dodo Payments and your note shows a small
                {{ formatPaise(9_900) }}-style badge. Without one, signing is
                free and instant, as always.
              </p>
            </UFormField>

            <p
              v-if="error"
              class="text-sm text-error"
              role="alert"
            >
              {{ error }}
            </p>
            <p
              v-else-if="done"
              class="text-sm text-success"
            >
              Thank you. It is up.
            </p>

            <UButton
              type="submit"
              :loading="saving"
              size="lg"
            >
              {{ tipAmount >= 1000 ? `Tip ${formatPaise(tipAmount)} and sign` : 'Sign the guestbook' }}
            </UButton>
          </div>
        </form>
      </ClientOnly>
    </section>

    <h2 class="label gb-heading">
      The wall
    </h2>

    <div
      v-if="status === 'pending' || status === 'idle'"
      class="gb-wall"
    >
      <USkeleton
        v-for="n in 6"
        :key="n"
        class="h-40 w-full mb-4"
      />
    </div>

    <UEmpty
      v-else-if="!data?.items.length"
      icon="i-lucide-book-open-text"
      title="Nobody has signed it yet"
      description="Be the first."
    />

    <div
      v-else
      class="gb-wall"
    >
      <GuestbookNote
        v-for="entry in data.items"
        :key="entry.id"
        :entry="entry"
      />
    </div>

    <section class="gb-more">
      <p class="headline">
        Want to do more than sign?
      </p>
      <p class="mt-2 text-muted max-w-xl">
        The guide is free and stays free. If it saved you a coaching fee, a
        small contribution keeps it online for the next person.
      </p>
      <div class="mt-5 flex flex-wrap gap-3">
        <UButton to="/support">
          Support the guide
        </UButton>
        <UButton
          to="/stories/new"
          color="neutral"
          variant="outline"
        >
          Share your story
        </UButton>
      </div>
    </section>
  </CommunityPage>
</template>

<style scoped>
/* The form sits under a heavy rule, not in a box. */
.gb-form {
  padding-top: 1.25rem;
  border-top: 2px solid var(--rule-strong);
}

.gb-fields {
  display: grid;
  gap: 1.5rem var(--gutter, 1.5rem);
}

@media (min-width: 768px) {
  .gb-fields {
    grid-template-columns: 3fr 2fr;
    align-items: start;
  }
}

.gb-heading {
  margin-top: 4rem;
  margin-bottom: 1rem;
}

/* The wall: masonry-ish columns; each note keeps itself whole. */
.gb-wall {
  columns: 1;
  column-gap: var(--gutter, 1.5rem);
}

@media (min-width: 640px) {
  .gb-wall {
    columns: 2;
  }
}

@media (min-width: 1024px) {
  .gb-wall {
    columns: 3;
  }
}

.gb-wall > * {
  break-inside: avoid;
  margin-bottom: var(--gutter, 1.5rem);
}

/* The tip amounts, in the same voice as the designer's CTA picks. */
.tips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.tips__pick {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  border: 1px solid var(--rule-color, var(--ui-border));
  background: transparent;
  cursor: pointer;
}

.tips__pick:hover {
  border-color: var(--ui-text-highlighted);
}

.tips__pick[aria-pressed='true'] {
  color: var(--ui-bg);
  background: var(--ui-text-highlighted);
  border-color: var(--ui-text-highlighted);
}

.gb-more {
  margin-top: 4rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--rule-color);
}
</style>
