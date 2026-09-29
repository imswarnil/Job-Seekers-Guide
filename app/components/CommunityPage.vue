<script setup lang="ts">
/**
 * The frame for the server-backed pages: stories, guestbook, sponsors,
 * support, stats, account and login. A narrow column with a kicker, a title
 * and a line of description, in the same type as the rest of the app.
 */
withDefaults(defineProps<{
  title: string
  description?: string
  kicker?: string
  icon?: string
  width?: 'narrow' | 'wide'
}>(), {
  width: 'narrow'
})
</script>

<template>
  <UContainer
    class="community py-8 lg:py-12"
    :data-width="width"
  >
    <header class="community__head">
      <p
        v-if="kicker"
        class="community__kicker"
      >
        <UIcon
          v-if="icon"
          :name="icon"
          class="size-4 text-primary"
        />
        {{ kicker }}
      </p>
      <h1 class="community__title">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="community__description"
      >
        {{ description }}
      </p>
      <div
        v-if="$slots.actions"
        class="community__actions"
      >
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </UContainer>
</template>

<style scoped>
.community {
  max-width: 48rem;
}

.community[data-width='wide'] {
  max-width: 72rem;
}

.community__head {
  margin-bottom: 2rem;
}

.community__kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-muted);
}

.community__title {
  margin-top: 0.75rem;
  font-size: clamp(1.75rem, 1.2rem + 2vw, 2.5rem);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
  text-wrap: balance;
}

.community__description {
  margin-top: 0.75rem;
  font-size: 1.0625rem;
  color: var(--ui-text-muted);
  text-wrap: pretty;
  max-width: 40rem;
}

.community__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.25rem;
}
</style>
