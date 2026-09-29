<script setup lang="ts">
/**
 * Who wrote this. The same card in the lesson column and on the home page, so
 * every page carries a person rather than a brand.
 *
 * No photo: the avatar is an initial in the house red until a real picture is
 * added here on purpose.
 */
withDefaults(defineProps<{
  /** `aside` for the narrow lesson column, `wide` for a full-width band. */
  variant?: 'aside' | 'wide'
}>(), {
  variant: 'aside'
})

const facts = [
  { value: '33', label: 'walk-ins said no' },
  { value: '34th', label: 'said yes' },
  { value: 'Now', label: 'in Europe' }
]
</script>

<template>
  <section
    class="author"
    :data-variant="variant"
    aria-label="About the author"
  >
    <div class="author__head">
      <span
        class="author__avatar"
        aria-hidden="true"
      >S</span>
      <div class="min-w-0">
        <p class="author__kicker">
          Written by
        </p>
        <p class="author__name">
          Swarnil Singhai
        </p>
      </div>
    </div>

    <p class="author__line">
      Mahroni to Bangalore to Europe. I failed my way through the walk-ins, then
      became a Salesforce engineer. This is what I wish I had known.
    </p>

    <dl class="author__facts">
      <div
        v-for="fact in facts"
        :key="fact.label"
      >
        <dt class="author__fact-value">
          {{ fact.value }}
        </dt>
        <dd class="author__fact-label">
          {{ fact.label }}
        </dd>
      </div>
    </dl>

    <div class="author__links">
      <UButton
        to="/my-story"
        label="Read my story"
        icon="i-lucide-footprints"
        size="sm"
        color="neutral"
        variant="subtle"
      />
      <UButton
        to="https://imswarnil.com"
        target="_blank"
        rel="noopener"
        label="imswarnil.com"
        trailing-icon="i-lucide-arrow-up-right"
        size="sm"
        color="neutral"
        variant="ghost"
      />
    </div>
  </section>
</template>

<style scoped>
.author {
  position: relative;
  overflow: hidden;
  padding: 1.125rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(22rem 10rem at 100% 0%, color-mix(in oklab, var(--ui-primary) 10%, transparent), transparent 70%),
    var(--ui-bg);
}

.author__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  background: var(--ui-primary);
  color: #fff;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--ui-primary) 18%, transparent);
}

.author__kicker {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.author__name {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--ui-text-highlighted);
}

.author__line {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.author__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.875rem;
}

.author__facts > div {
  padding: 0.5rem;
  border-radius: var(--radius-md);
  background: var(--ui-bg-elevated);
  text-align: center;
}

.author__fact-value {
  font-family: var(--font-pixel);
  font-size: 1.125rem;
  line-height: 1;
  color: var(--ui-primary);
}

.author__fact-label {
  margin-top: 0.25rem;
  font-size: 0.6875rem;
  line-height: 1.25;
  color: var(--ui-text-dimmed);
}

.author__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.875rem;
}

.author[data-variant='wide'] {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .author[data-variant='wide'] {
    grid-template-columns: auto 1fr auto;
    align-items: center;
    column-gap: 2rem;
  }

  .author[data-variant='wide'] .author__line {
    margin-top: 0;
    font-size: 1rem;
  }

  .author[data-variant='wide'] .author__facts {
    margin-top: 0;
    min-width: 16rem;
  }

  .author[data-variant='wide'] .author__links {
    grid-column: 1 / -1;
    margin-top: 0;
  }
}
</style>
