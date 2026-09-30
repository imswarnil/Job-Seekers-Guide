<script setup lang="ts">
/**
 * Who wrote this. The same block in the lesson column and on the home page, so
 * every page carries a person rather than a brand. No photo: a square initial
 * until a real picture is added here on purpose.
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
    <div class="author__who">
      <p class="label">
        Written by
      </p>
      <div class="author__head">
        <span
          class="author__avatar"
          aria-hidden="true"
        >S</span>
        <p class="author__name">
          Swarnil Singhai
        </p>
      </div>
      <p class="author__line">
        Mahroni to Bangalore to Europe. I failed my way through the walk-ins,
        then became a Salesforce engineer. This is what I wish I had known.
      </p>
    </div>

    <dl class="author__facts">
      <div
        v-for="fact in facts"
        :key="fact.label"
      >
        <dt class="author__fact-value num">
          {{ fact.value }}
        </dt>
        <dd class="author__fact-label">
          {{ fact.label }}
        </dd>
      </div>
    </dl>

    <div class="author__links">
      <NuxtLink
        to="/my-story"
        class="arrow-link"
      >
        Read my story
        <UIcon
          name="i-lucide-arrow-right"
          class="size-4"
        />
      </NuxtLink>
      <NuxtLink
        to="https://imswarnil.com/about"
        target="_blank"
        rel="noopener"
        class="arrow-link"
      >
        About me
        <UIcon
          name="i-lucide-arrow-up-right"
          class="size-4"
        />
      </NuxtLink>
      <NuxtLink
        to="https://imswarnil.com"
        target="_blank"
        rel="noopener"
        class="arrow-link"
      >
        imswarnil.com
        <UIcon
          name="i-lucide-arrow-up-right"
          class="size-4"
        />
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.author {
  border-top: 2px solid var(--rule-strong);
  padding-top: 1rem;
}

.author__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.author__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  background: var(--ui-text-highlighted);
  color: var(--ui-bg);
  font-size: 1.125rem;
  font-weight: 700;
}

.author__name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
}

.author__line {
  margin-top: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.author__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 1.25rem;
  border-block: 1px solid var(--rule-color);
}

.author__facts > div {
  padding: 0.75rem 0.5rem 0.75rem 0;
}

.author__facts > div + div {
  padding-left: 0.75rem;
  border-left: 1px solid var(--rule-color);
}

.author__fact-value {
  font-size: 1.5rem;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ui-text-highlighted);
}

.author__fact-label {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  line-height: 1.25;
  color: var(--ui-text-dimmed);
}

.author__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-top: 1rem;
}

/* The wide version sits on the page grid: who on the left, the numbers on the
   right, the links under both. */
.author[data-variant='wide'] {
  display: grid;
  grid-template-columns: repeat(var(--grid-cols), minmax(0, 1fr));
  column-gap: var(--gutter);
}

.author[data-variant='wide'] > * {
  grid-column: 1 / -1;
}

.author[data-variant='wide'] .author__name {
  font-size: 1.75rem;
}

.author[data-variant='wide'] .author__fact-value {
  font-size: 2.5rem;
}

@media (min-width: 1024px) {
  .author[data-variant='wide'] .author__who {
    grid-column: 1 / span 5;
  }

  .author[data-variant='wide'] .author__facts {
    grid-column: 7 / -1;
    align-self: start;
    margin-top: 2.25rem;
  }

  .author[data-variant='wide'] .author__links {
    margin-top: 1.5rem;
  }
}
</style>
