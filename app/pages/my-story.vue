<script setup lang="ts">
/**
 * The story. One page.
 *
 * It used to be three: an overview at `/my-story`, a ten-part web series behind
 * `/my-story/watch`, and the same story again as a flippable book behind
 * `/my-story/book` — sixteen chapter files, a CRT television, a page-turn sound
 * and about 2,400 lines of component to drive them.
 *
 * All of it is gone, for one reason. The person this page is written for has just
 * been rejected and is deciding whether this site is worth their evening. Asking
 * them to choose a format, and then to click sixteen times, is asking them to
 * commit before they have been given a reason to. A story you can read in one
 * scroll is a story that gets read.
 *
 * What is kept from the three-page version: the chapter spine, now a sticky rail
 * that tracks where the reader is rather than a table of contents they navigate
 * away through, and the four numbers, which are the only part of a story like
 * this that cannot be inspirational nonsense.
 */
const { data: page } = await useAsyncData('page:/my-story', () =>
  queryCollection('pages').path('/my-story').first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const description = page.value.seo?.description || page.value.description

usePageSeo({
  title: 'My story',
  description,
  headline: 'A true story'
})

useSeoMeta({ title: 'My story', ogTitle: page.value.seo?.title || page.value.title })

const site = useSiteConfig()

/* A biography of a named person, which search engines treat very differently
   from a page of marketing copy about one. */
useSchemaOrg([
  defineBreadcrumb({ itemListElement: [{ name: 'My story', item: '/my-story' }] }),
  {
    '@type': 'Person',
    'name': 'Swarnil Singhai',
    'jobTitle': 'Salesforce engineer',
    'description': 'Average student from Mahroni who cleared no written round in four years of college and is now a Salesforce engineer in Europe.',
    'url': `${site.url}/my-story`,
    'sameAs': ['https://github.com/imswarnil']
  }
])

const chapters = computed(() => page.value?.chapters || [])
const stats = computed(() => page.value?.stats || [])
const places = computed(() => page.value?.places || [])

/* ── Which chapter the reader is inside ─────────────────────────────────
   One IntersectionObserver over the `{#id}` anchors the markdown put on each
   heading, rather than a scroll listener doing arithmetic on every frame.

   `active` starts as the first chapter rather than empty, so the rail is never
   briefly unmarked on a page that has not been scrolled — and so it reads
   correctly in the prerendered HTML, before any of this runs. */
const active = ref<string>('')

watchEffect(() => {
  if (!active.value && chapters.value.length) {
    active.value = chapters.value[0]!.id
  }
})

onMounted(() => {
  const targets = chapters.value
    .map(chapter => document.getElementById(chapter.id))
    .filter((el): el is HTMLElement => Boolean(el))

  if (!targets.length) {
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      /* The topmost heading currently in the band wins. Taking the last entry
         to fire instead makes the rail jump backwards when two headings are on
         screen at once, which on a phone is most of the time. */
      const onScreen = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

      if (onScreen[0]?.target.id) {
        active.value = onScreen[0].target.id
      }
    },
    /* A band across the upper third of the viewport. A heading counts as "where
       you are" once it has reached the area you are actually reading, not the
       moment its first pixel appears at the bottom of the screen. */
    { rootMargin: '-72px 0px -66% 0px', threshold: 0 }
  )

  targets.forEach(target => observer.observe(target))
  onBeforeUnmount(() => observer.disconnect())
})
</script>

<template>
  <div v-if="page">
    <!-- ── The opening ────────────────────────────────────────────────────
         A dark band, because the story starts at its lowest point and the page
         should not look like a success story until it has earned it. -->
    <section class="guide-inverse story-hero">
      <div class="guide-contour story-hero__grid" />

      <UContainer class="story-hero__inner">
        <p class="story-hero__kicker">
          <span class="story-hero__dot" />
          {{ page.hero?.kicker }}
        </p>

        <h1 class="story-hero__title">
          {{ page.hero?.headline }}
        </h1>

        <p class="story-hero__lede">
          {{ page.hero?.lede }}
        </p>

        <!-- The numbers, before the prose. Somebody deciding whether to read
             2,500 words deserves to know where they end up. -->
        <dl
          v-if="stats.length"
          class="story-hero__stats"
        >
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="story-hero__stat"
          >
            <dt class="story-hero__value font-pixel">
              {{ stat.value }}
            </dt>
            <dd class="story-hero__label">
              {{ stat.label }}
            </dd>
          </div>
        </dl>
      </UContainer>
    </section>

    <!-- ── The route ──────────────────────────────────────────────────────
         Five towns in a row. The geography is half the story for anybody who
         grew up somewhere like Mahroni, and it is the fastest way to say "this
         is not a story about somebody who started in Bangalore". -->
    <section
      v-if="places.length"
      class="story-route"
    >
      <UContainer>
        <ol class="story-route__list">
          <li
            v-for="(place, index) in places"
            :key="place.place"
            class="story-route__item"
          >
            <span class="story-route__marker">
              <span class="story-route__pip" />
              <span
                v-if="index < places.length - 1"
                class="story-route__line"
              />
            </span>
            <p class="story-route__place">
              {{ place.place }}
            </p>
            <p
              v-if="place.years"
              class="story-route__years"
            >
              {{ place.years }}
            </p>
            <p class="story-route__note">
              {{ place.note }}
            </p>
          </li>
        </ol>
      </UContainer>
    </section>

    <!-- ── The story itself ───────────────────────────────────────────────── -->
    <UContainer class="story-body">
      <div class="story-body__grid">
        <!-- The spine. Sticky on a wide screen, and simply absent on a narrow
             one: a fifteen-item list above 2,500 words of prose is a wall
             between the reader and the first sentence. -->
        <nav
          v-if="chapters.length"
          class="story-rail"
          aria-label="Chapters"
        >
          <div class="story-rail__inner">
            <p class="story-rail__head">
              Fifteen chapters
            </p>
            <ol class="story-rail__list">
              <li
                v-for="chapter in chapters"
                :key="chapter.id"
              >
                <a
                  :href="`#${chapter.id}`"
                  class="story-rail__link"
                  :class="{ 'story-rail__link--on': active === chapter.id }"
                  :aria-current="active === chapter.id ? 'true' : undefined"
                >
                  <span
                    v-if="chapter.year"
                    class="story-rail__year"
                  >{{ chapter.year }}</span>
                  <span class="story-rail__label">{{ chapter.label }}</span>
                </a>
              </li>
            </ol>

            <AdSlot
              placement="sidebar"
              class="mt-6"
            />
          </div>
        </nav>

        <article class="guide-prose story-prose">
          <ContentRenderer :value="page" />
        </article>
      </div>
    </UContainer>

    <UContainer class="pb-10 lg:pb-16">
      <AdSlot
        placement="lesson-footer"
        class="mx-auto"
      />
    </UContainer>
  </div>
</template>

<style scoped>
/* ── The opening band ──────────────────────────────────────────────────── */
.story-hero {
  position: relative;
  overflow: hidden;
}

.story-hero__grid {
  position: absolute;
  inset: 0;
  opacity: 0.4;
  pointer-events: none;
}

.story-hero__inner {
  position: relative;
  padding-block: var(--spacing-phi-7);
}

@media (min-width: 1024px) {
  .story-hero__inner {
    padding-block: var(--spacing-phi-8);
  }
}

.story-hero__kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--guide-inverse-muted);
}

/* The recording light. One dot, the accent, and it does not blink — a pulsing
   element next to a paragraph about being rejected is the wrong register. */
.story-hero__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--color-guide-500);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-guide-500) 24%, transparent);
}

.story-hero__title {
  margin-top: var(--spacing-phi-5);
  max-width: 34ch;
  font-size: clamp(2rem, 1.4rem + 3vw, 3.25rem);
  line-height: 1.04;
  font-weight: 600;
  color: var(--guide-inverse-ink);
}

.story-hero__lede {
  margin-top: var(--spacing-phi-5);
  max-width: 58ch;
  font-size: 1.0625rem;
  line-height: 1.65;
}

.story-hero__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-phi-5);
  margin-top: var(--spacing-phi-6);
  padding-top: var(--spacing-phi-5);
  border-top: 1px solid var(--guide-inverse-line);
}

@media (min-width: 768px) {
  .story-hero__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.story-hero__value {
  font-size: clamp(1.5rem, 1.2rem + 1vw, 2rem);
  line-height: 1;
  color: var(--guide-inverse-ink);
}

.story-hero__label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--guide-inverse-muted);
}

/* ── The route ─────────────────────────────────────────────────────────── */
.story-route {
  border-bottom: 1px solid var(--ui-border);
  background: var(--ui-bg-muted);
  padding-block: var(--spacing-phi-6);
}

.story-route__list {
  display: grid;
  gap: var(--spacing-phi-5);
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 640px) {
  .story-route__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .story-route__list {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.story-route__marker {
  position: relative;
  display: flex;
  align-items: center;
  height: 0.5rem;
  margin-bottom: 0.875rem;
}

.story-route__pip {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--color-guide-600);
  flex-shrink: 0;
}

/* The connecting line runs between the towns, and only on the wide layout
   where they are actually in a row. */
.story-route__line {
  display: none;
}

@media (min-width: 1024px) {
  .story-route__line {
    display: block;
    flex: 1;
    height: 1px;
    margin-left: 0.375rem;
    margin-right: -1.618rem;
    background: var(--ui-border);
  }
}

.story-route__place {
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.story-route__years {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text-dimmed);
}

.story-route__note {
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ui-text-muted);
}

/* ── The body ──────────────────────────────────────────────────────────── */
.story-body {
  padding-block: var(--spacing-phi-6);
}

@media (min-width: 1024px) {
  .story-body {
    padding-block: var(--spacing-phi-7);
  }
}

.story-body__grid {
  display: grid;
  gap: var(--spacing-phi-6);
}

/* Seven columns of prose to five of rail, which is the nearest whole-column
   golden split the system allows. */
@media (min-width: 1024px) {
  .story-body__grid {
    grid-template-columns: 15rem minmax(0, 1fr);
    gap: var(--spacing-phi-7);
  }
}

.story-rail {
  display: none;
}

@media (min-width: 1024px) {
  .story-rail {
    display: block;
  }
}

.story-rail__inner {
  position: sticky;
  top: 5rem;
}

.story-rail__head {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
  padding-inline: 0.625rem;
}

.story-rail__list {
  margin-top: 0.75rem;
  border-left: 1px solid var(--ui-border);
}

.story-rail__link {
  display: block;
  padding: 0.375rem 0.625rem;
  margin-left: -1px;
  border-left: 2px solid transparent;
  font-size: 0.8125rem;
  line-height: 1.35;
  color: var(--ui-text-muted);
  transition: color 0.15s var(--ease-out-im), background-color 0.15s var(--ease-out-im);
}

.story-rail__link:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

/* "You are here", the system's one CURRENT state: a fill and a bolder label.
   Nothing grows and nothing lifts. */
.story-rail__link--on {
  border-left-color: var(--color-guide-600);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

.story-rail__year {
  display: block;
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text-dimmed);
}

.story-prose {
  /* Wider than the default reading measure: this is one long page rather than a
     lesson, and the chapter headings already break it up. */
  max-width: 72ch;
}

/* A chapter heading is a scroll target, so it needs to clear the sticky
   header when somebody arrives at it from the rail. */
.story-prose :deep(h2) {
  scroll-margin-top: 5.5rem;
}
</style>
