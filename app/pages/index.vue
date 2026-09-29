<script setup lang="ts">
/**
 * The app's start screen. Not a landing page: there is nothing to sell. It
 * says what this is in one screen, lets you continue, shows the route the
 * guide follows, and lists the guide itself.
 */
const { path } = usePath()
const { state, pathProgress, subjectProgress, resume } = useProgress()
const { open: openSearch } = useContentSearch()

const progress = computed(() => pathProgress(path.value))
const next = computed(() => resume(path.value))
const parts = computed(() => byStage(path.value))

const totals = computed(() => ({
  tracks: path.value.subjects.length,
  lessons: path.value.lessons.length,
  hours: Math.round(path.value.minutes / 60)
}))

/**
 * The route, stop by stop. Each stop links to the part of the guide that
 * teaches what that stop took, so the story and the guide are one thing.
 */
const route = [
  { year: '2018', place: 'Mahroni', text: 'Graduated. Wanted YouTube, needed a job. My father wanted a government teacher.', to: '/my-story', icon: 'i-lucide-house' },
  { year: '2018', place: 'The train', text: 'My sister backed me. One ticket to Bangalore.', to: '/bangalore', icon: 'i-lucide-train-front' },
  { year: '2018', place: 'BTM Layout', text: 'A PG where every room was a job seeker.', to: '/bangalore', icon: 'i-lucide-bed-double' },
  { year: '2019', place: 'JSpiders', text: 'Three days of demo classes, then three months of Java, SQL and web.', to: '/java', icon: 'i-lucide-code' },
  { year: '2019', place: '33 walk-ins', text: 'Aptitude, English and CS in parallel. Rejected, again and again.', to: '/quantitative-aptitude', icon: 'i-lucide-clipboard-list' },
  { year: '2019', place: 'The 34th', text: 'One of 700 to 1000 people. Selected.', to: '/interview', icon: 'i-lucide-badge-check' },
  { year: '2019', place: '₹13,000 a month', text: 'A startup, a bond, six days a week. Sundays for study.', to: '/interview', icon: 'i-lucide-wallet' },
  { year: '2019', place: 'Accenture', text: 'I wanted web development. I got Salesforce.', to: '/my-story', icon: 'i-lucide-building-2' },
  { year: '2022', place: '5 offers', text: 'A friend was on 21 LPA. I switched: 15.5 LPA, Cognizant.', to: '/interview', icon: 'i-lucide-trending-up' },
  { year: '2023', place: 'Twilio', text: '30+ LPA, Salesforce analytics in the GTM team.', to: '/my-story', icon: 'i-lucide-rocket' },
  { year: 'Now', place: 'Europe', text: 'Education First sponsored my visa. And I wrote this down.', to: '/my-story', icon: 'i-lucide-plane' }
]

usePageSeo({
  title: 'From Mahroni to your first IT job',
  description: 'From Mahroni to Bangalore with no skills, 33 walk-ins, selected in the 34th. Where to live, how to learn, Java, DSA, SQL, CS subjects, the written round and the interview: the whole route, free.',
  headline: 'By Swarnil'
})
</script>

<template>
  <div class="home">
    <!-- ── The promise ─────────────────────────────────────────────── -->
    <section class="home__band home__hero">
      <div class="home__inner">
        <p class="kicker">
          <span class="dot" /> Bangalore Job Seekers Guide · by Swarnil
        </p>

        <h1 class="mt-5 font-display text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-highlighted text-balance max-w-4xl">
          I got off the train in Bangalore knowing nothing.
          <span class="text-primary">This is the route I wish someone had handed me.</span>
        </h1>

        <p class="mt-6 text-lg sm:text-xl text-muted max-w-3xl text-pretty">
          Where to live, how to learn, what to study, how to clear the written
          round and what to say in the interview. I started writing it down as a
          job seeker in a PG in BTM, and promised myself that once I got a job it
          would become a path for the next person like me.
        </p>

        <div class="mt-8 flex flex-wrap items-center gap-3">
          <ClientOnly>
            <UButton
              :to="next?.path || '/bangalore'"
              :label="state.lastVisited && next ? `Continue: ${next.title}` : 'Start the guide'"
              trailing-icon="i-lucide-arrow-right"
              size="xl"
              class="max-w-full"
              :ui="{ label: 'truncate' }"
            />
            <template #fallback>
              <UButton
                to="/bangalore"
                label="Start the guide"
                trailing-icon="i-lucide-arrow-right"
                size="xl"
              />
            </template>
          </ClientOnly>

          <UButton
            to="/my-story"
            label="Read my story"
            icon="i-lucide-footprints"
            color="neutral"
            variant="subtle"
            size="xl"
          />

          <UButton
            label="Search"
            icon="i-lucide-search"
            color="neutral"
            variant="ghost"
            size="xl"
            @click="openSearch = true"
          >
            <template #trailing>
              <UKbd value="/" />
            </template>
          </UButton>
        </div>

        <dl class="mt-10 grid grid-cols-3 max-w-lg gap-6">
          <div>
            <dt class="stat__label">
              Tracks
            </dt>
            <dd class="stat__value">
              {{ totals.tracks }}
            </dd>
          </div>
          <div>
            <dt class="stat__label">
              Lessons
            </dt>
            <dd class="stat__value">
              {{ totals.lessons }}
            </dd>
          </div>
          <div>
            <dt class="stat__label">
              Hours of reading
            </dt>
            <dd class="stat__value">
              {{ totals.hours }}
            </dd>
          </div>
        </dl>

        <ClientOnly>
          <PlayerProgress
            v-if="progress.started"
            :progress="progress"
            :label="`${progress.completed} of ${progress.total} lessons finished`"
            class="mt-8 max-w-lg"
          />
        </ClientOnly>
      </div>
    </section>

    <!-- ── The route ───────────────────────────────────────────────── -->
    <section class="home__band">
      <div class="home__inner">
        <h2 class="section-title">
          The route
        </h2>
        <p class="section-lede">
          Every stop is a part of the guide. The rejections are left in.
        </p>

        <ol class="route mt-8">
          <li
            v-for="(stop, index) in route"
            :key="stop.place"
            class="route__stop"
          >
            <NuxtLink
              :to="stop.to"
              class="route__link"
            >
              <span class="route__node">
                <UIcon
                  :name="stop.icon"
                  class="size-4"
                />
              </span>
              <span class="route__year">{{ stop.year }}</span>
              <span class="route__place">{{ stop.place }}</span>
              <span class="route__text">{{ stop.text }}</span>
              <span
                v-if="index === 5"
                class="route__flag"
              >the turn</span>
            </NuxtLink>
          </li>
        </ol>
      </div>
    </section>

    <!-- ── The guide ───────────────────────────────────────────────── -->
    <section class="home__band">
      <div class="home__inner">
        <h2 class="section-title">
          The guide, in order
        </h2>
        <p class="section-lede">
          Read it top to bottom, or search for the thing you need tomorrow morning.
        </p>

        <div class="mt-8 grid gap-6 lg:grid-cols-2">
          <section
            v-for="part in parts"
            :key="part.stage"
            class="part"
          >
            <header class="flex items-start gap-3">
              <span class="part__icon">
                <UIcon
                  :name="part.icon"
                  class="size-5"
                />
              </span>
              <div class="min-w-0">
                <h3 class="font-display text-lg font-semibold text-highlighted">
                  {{ part.label }}
                </h3>
                <p class="text-sm text-muted mt-1 text-pretty">
                  {{ part.blurb }}
                </p>
              </div>
            </header>

            <ul class="mt-4 divide-y divide-default">
              <li
                v-for="(subject, index) in part.subjects"
                :key="subject.path"
              >
                <NuxtLink
                  :to="subject.path"
                  class="track"
                >
                  <span class="track__number">{{ String(part.offset + index + 1).padStart(2, '0') }}</span>
                  <UIcon
                    :name="subject.icon || 'i-lucide-book-open'"
                    class="size-4 text-dimmed shrink-0"
                  />
                  <span class="flex-1 min-w-0">
                    <span class="block truncate font-medium text-highlighted">{{ subject.title }}</span>
                    <span class="block text-xs text-dimmed tabular-nums">
                      {{ subject.lessons.length }} lessons<template v-if="subject.minutes"> · {{ formatMinutes(subject.minutes) }}</template>
                    </span>
                  </span>
                  <ClientOnly>
                    <PlayerProgress
                      v-if="subjectProgress(subject).started"
                      :progress="subjectProgress(subject)"
                      variant="ring"
                      :size="20"
                    />
                  </ClientOnly>
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-4 text-dimmed shrink-0"
                  />
                </NuxtLink>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </section>

    <!-- ── Why ─────────────────────────────────────────────────────── -->
    <section class="home__band home__why">
      <div class="home__inner">
        <blockquote class="max-w-3xl">
          <p class="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-highlighted text-balance">
            “If you have lost faith, I have been there. Thirty-three walk-ins said
            no. The thirty-fourth said yes. Nothing about me changed except what I
            had practised.”
          </p>
          <footer class="mt-5 text-muted">
            Swarnil, Salesforce engineer. Mahroni → Bangalore → Europe.
          </footer>
        </blockquote>

        <div class="mt-8 flex flex-wrap gap-3">
          <UButton
            to="/bangalore"
            label="Start with the move"
            trailing-icon="i-lucide-arrow-right"
          />
          <UButton
            to="/my-story"
            label="Read the whole story"
            color="neutral"
            variant="subtle"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home__band {
  border-bottom: 1px solid var(--ui-border);
  padding-block: 3.5rem;
}

.home__hero {
  padding-block: 4rem 3.5rem;
  background:
    radial-gradient(60rem 24rem at 0% 0%, color-mix(in oklab, var(--ui-primary) 9%, transparent), transparent 70%);
}

@media (min-width: 1024px) {
  .home__hero {
    padding-top: 5.5rem;
  }
}

.home__inner {
  max-width: 76rem;
  margin-inline: auto;
  padding-inline: 1rem;
}

@media (min-width: 640px) {
  .home__inner {
    padding-inline: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .home__inner {
    padding-inline: 2.5rem;
  }
}

.kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ui-text-muted);
}

/* The recording light. */
.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--ui-primary);
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--ui-primary) 18%, transparent);
}

.stat__label {
  font-size: 0.75rem;
  color: var(--ui-text-dimmed);
}

.stat__value {
  margin-top: 0.25rem;
  font-family: var(--font-pixel);
  font-size: 2rem;
  line-height: 1;
  color: var(--ui-text-highlighted);
  font-variant-numeric: tabular-nums;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ui-text-highlighted);
}

.section-lede {
  margin-top: 0.375rem;
  color: var(--ui-text-muted);
}

/* ── The route: a vertical line on phones, a grid of stops on wide screens. */
.route {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .route {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .route {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.route__link {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    'node year'
    'node place'
    'node text';
  column-gap: 0.75rem;
  height: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-lg);
  background: var(--ui-bg);
  transition: border-color var(--dgm-t-fast) var(--dgm-ease), transform var(--dgm-t-fast) var(--dgm-ease);
}

.route__link:hover {
  border-color: var(--ui-border-accented);
  transform: translateY(-1px);
}

.route__node {
  grid-area: node;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-muted);
}

.route__stop:nth-child(6) .route__node {
  background: var(--ui-primary);
  color: var(--ui-bg);
}

.route__year {
  grid-area: year;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.route__place {
  grid-area: place;
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.route__text {
  grid-area: text;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.route__flag {
  position: absolute;
  top: 0.75rem;
  right: 0.875rem;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-primary);
}

/* ── The parts ─────────────────────────────────────────────────────── */
.part {
  padding: 1.25rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-lg);
  background: var(--ui-bg);
}

.part__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  background: color-mix(in oklab, var(--ui-primary) 10%, transparent);
  color: var(--ui-primary);
}

.track {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.5rem;
  margin-inline: -0.5rem;
  border-radius: var(--radius-md);
  transition: background-color var(--dgm-t-fast) var(--dgm-ease);
}

.track:hover {
  background: var(--ui-bg-elevated);
}

.track__number {
  width: 1.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ui-text-dimmed);
  font-variant-numeric: tabular-nums;
}

.home__why {
  border-bottom: 0;
  background: var(--ui-bg-elevated);
}
</style>
