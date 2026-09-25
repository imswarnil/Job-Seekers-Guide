<script setup lang="ts">
/**
 * Who is telling you all this, on the front page.
 *
 * This replaces `StoryReel.vue`, which was 1,156 lines: a drawn CRT television
 * playing a YouTube trailer, a drawn book beside it, a shelf of ten episode
 * cards, and the numbers underneath. It was the most expensive thing on the
 * front page and its job was to make somebody click through to a page that
 * exists either way.
 *
 * The story is one page now, so this band only has to do what a band on a front
 * page can actually do: make the claim, prove it with four numbers, and get out
 * of the way. The numbers are read from the story page itself rather than typed
 * here, so there is exactly one place where they can be wrong.
 */
const { data: story } = await useAsyncData('home:story', () =>
  queryCollection('pages').path('/my-story').select('stats', 'hero').first()
)

const stats = computed(() => story.value?.stats || [])
</script>

<template>
  <section class="guide-inverse home-story">
    <div class="guide-contour home-story__grid" />

    <UContainer class="home-story__inner">
      <div class="home-story__cols">
        <div class="home-story__say">
          <p class="home-story__kicker">
            <span class="home-story__dot" />
            Whose path this is
          </p>

          <h2 class="home-story__title">
            I could not clear a single written round in four years of college.
          </h2>

          <p class="home-story__body">
            Not one. Java, aptitude, written English, reasoning: rejected in round
            one, every time. Nobody in my family had done this, there was no money
            for a plan B, and the plan at home was a government teaching exam.
          </p>

          <p class="home-story__body">
            What eventually worked was not talent. It was a sequence, and somebody
            telling me what to learn next. That cost me ₹40,000 and a year I did
            not need to lose, and it is the thing this site gives away.
          </p>

          <UButton
            to="/my-story"
            label="Read the whole thing"
            icon="i-lucide-arrow-right"
            trailing
            size="lg"
            class="mt-6"
          />
        </div>

        <!-- The numbers, as a column rather than a row: against a paragraph they
             read as a receipt for it, which is what they are. -->
        <dl
          v-if="stats.length"
          class="home-story__stats"
        >
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="home-story__stat"
          >
            <dt class="home-story__value font-pixel">
              {{ stat.value }}
            </dt>
            <dd class="home-story__label">
              {{ stat.label }}
            </dd>
          </div>
        </dl>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.home-story {
  position: relative;
  overflow: hidden;
}

.home-story__grid {
  position: absolute;
  inset: 0;
  opacity: 0.4;
  pointer-events: none;
}

.home-story__inner {
  position: relative;
  padding-block: var(--spacing-phi-7);
}

.home-story__cols {
  display: grid;
  gap: var(--spacing-phi-6);
}

/* Seven columns of words to five of numbers, the nearest whole-column golden
   split. */
@media (min-width: 1024px) {
  .home-story__cols {
    grid-template-columns: 7fr 5fr;
    gap: var(--spacing-phi-7);
    align-items: start;
  }
}

.home-story__kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--guide-inverse-muted);
}

.home-story__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--color-guide-500);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-guide-500) 24%, transparent);
}

.home-story__title {
  margin-top: var(--spacing-phi-5);
  max-width: 30ch;
  font-size: clamp(1.625rem, 1.3rem + 1.6vw, 2.25rem);
  line-height: 1.12;
  font-weight: 600;
  color: var(--guide-inverse-ink);
}

.home-story__body {
  margin-top: var(--spacing-phi-5);
  max-width: 54ch;
  line-height: 1.65;
}

.home-story__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-phi-5);
}

@media (min-width: 1024px) {
  .home-story__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-top: var(--spacing-phi-6);
  }
}

.home-story__stat {
  padding-top: var(--spacing-phi-4);
  border-top: 1px solid var(--guide-inverse-line);
}

.home-story__value {
  font-size: clamp(1.5rem, 1.2rem + 1vw, 2rem);
  line-height: 1;
  color: var(--guide-inverse-ink);
}

.home-story__label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--guide-inverse-muted);
}
</style>
