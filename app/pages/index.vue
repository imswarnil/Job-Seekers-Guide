<script setup lang="ts">
import { trackStyle } from '~/utils/tech'

/**
 * The app's start screen. Not a landing page: there is nothing to sell. It
 * says what this is in one screen, shows who is reading right now, gives the
 * places people come back for one click each, walks the route I took, shows
 * the newest stories and guestbook lines, and lists the guide itself with your
 * progress through each track.
 */
const { path } = usePath()
const { state, pathProgress, subjectProgress, resume } = useProgress()
const { open: openSearch } = useContentSearch()
const searchTerm = useState('search-term', () => '')
const { hero } = useAppConfig()
const route = useRoute()

const progress = computed(() => pathProgress(path.value))
const next = computed(() => resume(path.value))
const parts = computed(() => byStage(path.value))

const totals = computed(() => ({
  tracks: path.value.subjects.length,
  lessons: path.value.lessons.length,
  hours: Math.round(path.value.minutes / 60)
}))

const videoId = computed(() => (hero?.youtubeId || '').trim())

// The site search, reachable from a search engine: `/?q=joins` opens it with
// the term typed in. The WebSite schema below advertises exactly this URL.
onMounted(() => {
  const q = route.query.q
  if (typeof q === 'string' && q.trim()) {
    searchTerm.value = q.trim()
    openSearch.value = true
  }
})

usePageSeo({
  title: 'From Mahroni to your first IT job',
  description: 'From Mahroni to Bangalore with no skills, 33 walk-ins, selected in the 34th. Where to live, how to learn, Java, DSA, SQL, CS subjects, the written round and the interview: the whole route, free.',
  headline: 'By Swarnil',
  type: 'website'
})

useSchemaOrg([
  defineWebSite({
    potentialAction: [
      defineSearchAction({ target: '/?q={search_term_string}' })
    ]
  })
])
</script>

<template>
  <div class="home">
    <!-- ── The promise ─────────────────────────────────────────────── -->
    <section
      class="home__band home__hero"
      :data-video="videoId ? '' : undefined"
    >
      <HomeHeroVideo
        v-if="videoId"
        :id="videoId"
      />

      <div class="home__inner relative">
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
            :label="`You have finished ${progress.completed} of ${progress.total} lessons`"
            class="mt-8 max-w-lg"
          />
        </ClientOnly>

        <div class="mt-8 flex flex-wrap gap-2">
          <NuxtLink
            to="/stories/new"
            class="nudge card-hover"
          >
            <UIcon
              name="i-lucide-briefcase"
              class="size-4 text-primary shrink-0"
            />
            Did you get a job with this guide? Tell me.
          </NuxtLink>
          <NuxtLink
            to="/guestbook"
            class="nudge card-hover"
          >
            <UIcon
              name="i-lucide-pen-line"
              class="size-4 text-primary shrink-0"
            />
            Learned something? Sign the guestbook.
          </NuxtLink>
        </div>

        <p class="mt-4 text-sm text-dimmed">
          <NuxtLink
            to="/my-story"
            class="underline underline-offset-4 hover:text-highlighted"
          >I was inspired by the story</NuxtLink>. It is all there, chapter by chapter, with the numbers left in.
        </p>
      </div>
    </section>

    <!-- ── Live numbers ────────────────────────────────────────────── -->
    <section
      class="home__band home__stats"
      aria-label="Live numbers"
    >
      <div class="home__inner">
        <p class="kicker">
          <span class="dot dot--live" /> Live, right now
        </p>
        <ClientOnly>
          <HomeLiveStats class="mt-4" />
          <template #fallback>
            <USkeleton class="mt-4 h-40 sm:h-24" />
          </template>
        </ClientOnly>
      </div>
    </section>

    <!-- ── Quick links ─────────────────────────────────────────────── -->
    <section class="home__band">
      <div class="home__inner">
        <h2 class="section-title">
          Quick links
        </h2>
        <p class="section-lede">
          The pages people come back for.
        </p>
        <HomeQuickLinks class="mt-8" />
      </div>
    </section>

    <!-- ── My journey ──────────────────────────────────────────────── -->
    <section class="home__band home__journey">
      <div class="home__inner">
        <h2 class="section-title">
          My journey
        </h2>
        <p class="section-lede">
          Every stop is a chapter of my story and a part of the guide. The rejections are left in.
        </p>

        <HomeJourney class="mt-10" />
      </div>
    </section>

    <!-- The site's one sponsor spot, once, between the story and the guide. -->
    <div class="home__sponsor">
      <div class="home__inner">
        <SponsorSlot
          name="brand"
          variant="banner"
        />
      </div>
    </div>

    <!-- ── Stories and the guestbook ───────────────────────────────── -->
    <section class="home__band">
      <div class="home__inner">
        <HomeCommunity />
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
          Your progress stays in this browser.
        </p>

        <div class="mt-10 space-y-12">
          <section
            v-for="part in parts"
            :key="part.stage"
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
                <p class="text-sm text-muted mt-1 text-pretty max-w-3xl">
                  {{ part.blurb }}
                </p>
              </div>
            </header>

            <ul class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <li
                v-for="(subject, index) in part.subjects"
                :key="subject.path"
              >
                <NuxtLink
                  :to="subject.path"
                  class="track card-hover"
                  :style="{ '--track': trackStyle(subject.slug, subject.icon).color }"
                >
                  <TrackThumb
                    :slug="subject.slug"
                    :icon="subject.icon"
                    :image="subject.image"
                  />
                  <span class="track__body">
                    <span class="track__number">{{ String(part.offset + index + 1).padStart(2, '0') }}</span>
                    <span class="track__title">{{ subject.title }}</span>
                    <span
                      v-if="subject.description"
                      class="track__text"
                    >{{ subject.description }}</span>
                    <span class="track__meta">
                      {{ subject.lessons.length }} lessons<template v-if="subject.minutes"> · {{ formatMinutes(subject.minutes) }}</template>
                    </span>
                    <ClientOnly>
                      <span
                        class="track__bar"
                        :data-done="subjectProgress(subject).finished || undefined"
                        :style="{ '--pct': `${subjectProgress(subject).percent}%` }"
                        :title="`${subjectProgress(subject).completed} of ${subjectProgress(subject).total} finished`"
                      />
                      <span
                        v-if="subjectProgress(subject).started"
                        class="track__progress"
                      >{{ subjectProgress(subject).completed }} of {{ subjectProgress(subject).total }} finished</span>
                    </ClientOnly>
                  </span>
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

        <AuthorCard
          variant="wide"
          class="mt-10"
        />
      </div>
    </section>

    <!-- ── What was on my desk ────────────────────────────────────── -->
    <section class="home__band">
      <div class="home__inner">
        <ProductShelf title="What was on my desk in the PG" />
      </div>
    </section>

    <!-- ── What next ───────────────────────────────────────────────── -->
    <section class="home__band home__next">
      <div class="home__inner">
        <p class="kicker">
          <span class="dot" /> What next
        </p>
        <h2 class="mt-4 font-display text-2xl sm:text-3xl font-bold tracking-tight text-highlighted text-balance max-w-3xl">
          I do not know what happens next either.
        </h2>
        <div class="mt-5 max-w-3xl space-y-4 text-muted text-pretty">
          <p>
            I live in Europe now. The walk-in queues I stood in are not the same
            queues you will stand in: AI is changing what a fresher is hired to
            do, and it is changing my job as well.
          </p>
          <p>
            I am as clueless as anyone about where it lands. What I do know is
            that the person who understands the basics can tell when the machine
            is wrong, and that is still worth being. The story carries on, and I
            write the next part of it at imswarnil.com.
          </p>
        </div>
        <div class="mt-8 flex flex-wrap gap-3">
          <UButton
            to="https://imswarnil.com"
            target="_blank"
            rel="noopener"
            label="Follow the story at imswarnil.com"
            trailing-icon="i-lucide-arrow-up-right"
          />
          <UButton
            to="/bangalore"
            label="Or start the guide"
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
  position: relative;
  overflow: hidden;
  padding-block: 4rem 3.5rem;
  background:
    radial-gradient(60rem 24rem at 0% 0%, color-mix(in oklab, var(--ui-primary) 9%, transparent), transparent 70%);
}

@media (min-width: 1024px) {
  .home__hero {
    padding-top: 5.5rem;
  }
}

/* With a video behind it the hero is dark in both colour modes, so its text
   and controls switch to light. Wide screens only: on a phone there is no
   video and the hero is the ordinary page. */
@media (min-width: 768px) {
  .home__hero[data-video] {
    color-scheme: dark;
    --ui-text: #fafafa;
    --ui-text-highlighted: #fff;
    --ui-text-muted: rgb(255 255 255 / 0.8);
    --ui-text-dimmed: rgb(255 255 255 / 0.62);
    --ui-bg: rgb(10 10 10 / 0.4);
    --ui-bg-elevated: rgb(255 255 255 / 0.1);
    --ui-bg-accented: rgb(255 255 255 / 0.16);
    --ui-border: rgb(255 255 255 / 0.18);
    --ui-border-accented: rgb(255 255 255 / 0.32);
    --ui-primary: var(--color-guide-400);
    border-bottom-color: transparent;
    padding-block: 7rem 5rem;
  }

  /* Whatever frame the video is on, the words stay readable: the shade does
     most of it, a soft shadow under the type does the rest. */
  .home__hero[data-video] :where(h1, p, dt, dd, a) {
    text-shadow: 0 1px 16px rgb(0 0 0 / 0.55), 0 1px 2px rgb(0 0 0 / 0.4);
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
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ui-text-muted);
}

/* The recording light. */
.dot--live {
  background: var(--ui-success);
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--ui-success) 18%, transparent);
  animation: live 1.8s var(--dgm-ease) infinite;
}

@keyframes live {
  50% {
    box-shadow: 0 0 0 7px color-mix(in oklab, var(--ui-success) 6%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot--live {
    animation: none;
  }
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--ui-primary);
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--ui-primary) 18%, transparent);
}

.stat__label {
  font-size: var(--text-xs);
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

.nudge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--ui-border);
  border-radius: 2px;
  background: var(--ui-bg);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ui-text-highlighted);
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ui-text-highlighted);
}

@media (min-width: 640px) {
  .section-title {
    font-size: 2.125rem;
  }
}

.section-lede {
  margin-top: 0.375rem;
  color: var(--ui-text-muted);
}

.home__journey {
  background:
    radial-gradient(40rem 20rem at 100% 0%, color-mix(in oklab, var(--ui-primary) 6%, transparent), transparent 70%),
    var(--ui-bg-muted);
}

/* ── The parts ─────────────────────────────────────────────────────── */
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
  flex-direction: column;
  height: 100%;
  padding: 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 0;
  background: var(--ui-bg);
}

.track__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0.75rem 0.5rem 0.375rem;
}

.track__number {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ui-text-dimmed);
  font-variant-numeric: tabular-nums;
}

.track__title {
  margin-top: 0.125rem;
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.track__text {
  display: -webkit-box;
  margin-top: 0.375rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--ui-text-muted);
}

.track__meta {
  margin-top: auto;
  padding-top: 0.75rem;
  font-size: var(--text-xs);
  color: var(--ui-text-dimmed);
  font-variant-numeric: tabular-nums;
}

.track__bar {
  display: block;
  height: 4px;
  margin-top: 0.5rem;
  border-radius: 999px;
  background: var(--ui-bg-accented);
  overflow: hidden;
}

.track__bar::after {
  content: '';
  display: block;
  width: var(--pct);
  height: 100%;
  border-radius: 999px;
  background: var(--track);
  transition: width var(--dgm-t-base) var(--dgm-ease);
}

.track__bar[data-done]::after {
  background: var(--ui-success);
}

.track__progress {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  font-variant-numeric: tabular-nums;
}

.home__stats {
  padding-block: 2.5rem;
  background: var(--ui-bg-muted);
}

.home__sponsor {
  padding-block: 2rem;
  border-bottom: 1px solid var(--ui-border);
}

.home__why {
  background: var(--ui-bg-elevated);
}

.home__next {
  border-bottom: 0;
}
</style>
