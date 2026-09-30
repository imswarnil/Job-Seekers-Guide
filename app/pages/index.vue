<script setup lang="ts">
import { trackStyle } from '~/utils/tech'

/**
 * The app's start screen, on the grid. Not a landing page: there is nothing
 * to sell. What this is, who is reading right now, the places people come
 * back for, the route I took, the newest stories and guestbook lines, the
 * guide itself with your progress through each track, who wrote it, and what
 * comes next.
 *
 * Every band is full width with the column guide lines behind it and a rule
 * under it; everything inside snaps to the twelve columns.
 */
const { path } = usePath()
const { state, pathProgress, subjectProgress, resume } = useProgress()
const { open: openSearch } = useContentSearch()
const searchTerm = useState('search-term', () => '')
const { hero } = useAppConfig()
const route = useRoute()
const mounted = useMounted()

const progress = computed(() => pathProgress(path.value))
const next = computed(() => resume(path.value))
const parts = computed(() => byStage(path.value))

const totals = computed(() => ({
  tracks: path.value.subjects.length,
  lessons: path.value.lessons.length,
  hours: Math.round(path.value.minutes / 60)
}))

const videoId = computed(() => (hero?.youtubeId || '').trim())

function trackStatus(subject: Parameters<typeof subjectProgress>[0]) {
  if (!mounted.value) {
    return undefined
  }
  const p = subjectProgress(subject)
  return p.finished ? 'done' : p.started ? 'doing' : undefined
}

// `/?q=joins` opens the search with the term typed in. The WebSite schema
// below advertises exactly this URL.
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
      class="band guides hero"
      :data-video="videoId ? '' : undefined"
    >
      <HomeHeroVideo
        v-if="videoId"
        :id="videoId"
      />

      <div class="frame swiss-grid hero__grid">
        <p class="label hero__kicker">
          <span class="mark" /> Bangalore Job Seekers Guide · by Swarnil
        </p>

        <h1 class="display hero__title">
          I got off the train in Bangalore knowing nothing.
          <span class="hero__title-2">This is the route I wish someone had handed me.</span>
        </h1>

        <p class="lede hero__lede">
          Where to live, how to learn, what to study, how to clear the written
          round and what to say in the interview. I started writing it down as a
          job seeker in a PG in BTM, and promised myself that once I got a job it
          would become a path for the next person like me.
        </p>

        <div class="hero__actions">
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
            color="neutral"
            variant="outline"
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

        <dl class="hero__facts">
          <div>
            <dt class="label">
              Tracks
            </dt>
            <dd class="num">
              {{ totals.tracks }}
            </dd>
          </div>
          <div>
            <dt class="label">
              Lessons
            </dt>
            <dd class="num">
              {{ totals.lessons }}
            </dd>
          </div>
          <div>
            <dt class="label">
              Hours of reading
            </dt>
            <dd class="num">
              {{ totals.hours }}
            </dd>
          </div>
        </dl>

        <ClientOnly>
          <PlayerProgress
            v-if="progress.started"
            :progress="progress"
            :label="`You have finished ${progress.completed} of ${progress.total} lessons`"
            class="hero__progress"
          />
        </ClientOnly>

        <ul class="hero__nudges">
          <li>
            <NuxtLink
              to="/stories/new"
              class="arrow-link"
            >
              Did you get a job with this guide? Tell me.
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4"
              />
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/guestbook"
              class="arrow-link"
            >
              Learned something? Sign the guestbook.
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4"
              />
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── Live numbers ────────────────────────────────────────────── -->
    <section
      class="band guides"
      aria-labelledby="home-live"
    >
      <div class="frame">
        <h2
          id="home-live"
          class="label"
        >
          <span
            class="mark"
            data-live
          /> Live, right now
        </h2>
        <ClientOnly>
          <HomeLiveStats class="mt-6" />
          <template #fallback>
            <USkeleton class="mt-6 h-48" />
          </template>
        </ClientOnly>
      </div>
    </section>

    <!-- ── Quick links ─────────────────────────────────────────────── -->
    <section
      class="band guides"
      aria-labelledby="home-quick"
    >
      <div class="frame swiss-grid">
        <header class="section-head">
          <p class="label">
            01
          </p>
          <h2
            id="home-quick"
            class="headline mt-3"
          >
            Quick links
          </h2>
          <p class="section-lede">
            The pages people come back for.
          </p>
        </header>
        <HomeQuickLinks class="section-body" />
      </div>
    </section>

    <!-- ── My journey ──────────────────────────────────────────────── -->
    <section
      class="band guides"
      aria-labelledby="home-journey"
    >
      <div class="frame">
        <div class="swiss-grid">
          <header class="section-head section-head--wide">
            <p class="label">
              02
            </p>
            <h2
              id="home-journey"
              class="headline mt-3"
            >
              My journey
            </h2>
            <p class="section-lede">
              Every stop is a chapter of my story and a part of the guide. The rejections are left in.
            </p>
          </header>
        </div>

        <HomeJourney class="mt-12" />
      </div>
    </section>

    <!-- The site's one sponsor spot, once, between the story and the guide. -->
    <div class="band band--thin guides">
      <div class="frame">
        <SponsorSlot
          name="brand"
          variant="banner"
        />
      </div>
    </div>

    <!-- ── Stories and the guestbook ───────────────────────────────── -->
    <section class="band guides">
      <div class="frame">
        <HomeCommunity />
      </div>
    </section>

    <!-- ── The guide ───────────────────────────────────────────────── -->
    <section
      class="band guides"
      aria-labelledby="home-guide"
    >
      <div class="frame">
        <div class="swiss-grid">
          <header class="section-head section-head--wide">
            <p class="label">
              05
            </p>
            <h2
              id="home-guide"
              class="headline mt-3"
            >
              The guide, in order
            </h2>
            <p class="section-lede">
              Read it top to bottom, or search for the thing you need tomorrow
              morning. Your progress stays in this browser.
            </p>
          </header>
        </div>

        <div class="parts">
          <section
            v-for="part in parts"
            :key="part.stage"
            class="part swiss-grid"
            :aria-label="part.label"
          >
            <header class="part__head">
              <h3 class="part__title">
                {{ part.label }}
              </h3>
              <p class="part__blurb">
                {{ part.blurb }}
              </p>
            </header>

            <ol class="part__tracks row-list">
              <li
                v-for="(subject, index) in part.subjects"
                :key="subject.path"
              >
                <NuxtLink
                  :to="subject.path"
                  class="track row-link"
                  :data-status="trackStatus(subject)"
                  :style="{ '--track': trackStyle(subject.slug, subject.icon).color }"
                >
                  <span class="track__n num">{{ String(part.offset + index + 1).padStart(2, '0') }}</span>
                  <span
                    class="track__swatch"
                    aria-hidden="true"
                  />
                  <span class="track__main">
                    <span class="track__title">{{ subject.title }}</span>
                    <span
                      v-if="subject.description"
                      class="track__text"
                    >{{ subject.description }}</span>
                  </span>
                  <span class="track__meta num">
                    <span>{{ subject.lessons.length }} lessons</span>
                    <span v-if="subject.minutes">{{ formatMinutes(subject.minutes) }}</span>
                    <ClientOnly>
                      <span
                        v-if="subjectProgress(subject).started"
                        class="track__progress"
                      >{{ subjectProgress(subject).percent }}% done</span>
                    </ClientOnly>
                  </span>
                </NuxtLink>
              </li>
            </ol>
          </section>
        </div>
      </div>
    </section>

    <!-- ── Why ─────────────────────────────────────────────────────── -->
    <section class="band guides">
      <div class="frame swiss-grid">
        <blockquote class="quote">
          <p class="quote__text">
            “If you have lost faith, I have been there. Thirty-three walk-ins said
            no. The thirty-fourth said yes. Nothing about me changed except what I
            had practised.”
          </p>
          <footer class="label mt-6">
            Swarnil, Salesforce engineer · Mahroni, Bangalore, Europe
          </footer>
        </blockquote>

        <AuthorCard
          variant="wide"
          class="quote__author"
        />
      </div>
    </section>

    <!-- ── What was on my desk ────────────────────────────────────── -->
    <section class="band guides">
      <div class="frame">
        <ProductShelf title="What was on my desk in the PG" />
      </div>
    </section>

    <!-- ── What next ───────────────────────────────────────────────── -->
    <section class="band guides home__next">
      <div class="frame swiss-grid">
        <header class="section-head">
          <p class="label">
            <span class="mark" /> What next
          </p>
        </header>
        <div class="section-body">
          <h2 class="headline">
            I do not know what happens next either.
          </h2>
          <div class="next__text">
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
              variant="outline"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Sections: a label and a headline on the left three columns, the body on
   the right nine. On a phone they stack. ─────────────────────────────────── */
.section-head,
.section-body {
  grid-column: 1 / -1;
}

.section-body {
  margin-top: 2rem;
}

.section-lede {
  margin-top: 0.75rem;
  max-width: 34rem;
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

@media (min-width: 1024px) {
  .section-head {
    grid-column: 1 / span 3;
  }

  .section-head--wide {
    grid-column: 1 / span 8;
  }

  .section-body {
    grid-column: 4 / -1;
    margin-top: 0;
  }
}

/* ── The hero ─────────────────────────────────────────────────────────── */
.hero {
  position: relative;
  overflow: hidden;
}

.hero__grid > * {
  grid-column: 1 / -1;
  position: relative;
}

.hero__title {
  margin-top: 1.5rem;
}

.hero__title-2 {
  display: block;
  color: var(--ui-text-muted);
}

.hero__lede {
  margin-top: 1.75rem;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2.25rem;
}

.hero__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 3rem;
  border-top: 1px solid var(--rule-color);
}

.hero__facts > div {
  padding: 0.875rem 1rem 0 0;
}

.hero__facts > div + div {
  padding-left: 1rem;
  border-left: 1px solid var(--rule-color);
}

.hero__facts dd {
  margin-top: 0.5rem;
  font-size: clamp(2rem, 1.4rem + 2.4vw, 3.5rem);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.045em;
  color: var(--ui-text-highlighted);
}

.hero__progress {
  margin-top: 2rem;
  max-width: 28rem;
}

.hero__nudges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 2rem;
  margin-top: 2.5rem;
}

@media (min-width: 1024px) {
  .hero {
    padding-block: 6rem 5rem;
  }

  .hero__title {
    grid-column: 1 / span 11;
  }

  .hero__lede {
    grid-column: 1 / span 6;
  }

  .hero__facts {
    grid-column: 1 / span 6;
  }
}

/* With a video behind it the hero is dark in both colour modes, so its text,
   rules and controls switch to light. Wide screens only: a phone gets no
   video, and the hero is the ordinary page. */
@media (min-width: 768px) {
  .hero[data-video] {
    color-scheme: dark;
    --ui-text: #fafafa;
    --ui-text-highlighted: #fff;
    --ui-text-muted: rgb(255 255 255 / 0.78);
    --ui-text-dimmed: rgb(255 255 255 / 0.6);
    --ui-bg: rgb(10 10 10 / 0.4);
    --ui-bg-elevated: rgb(255 255 255 / 0.1);
    --ui-bg-accented: rgb(255 255 255 / 0.16);
    --ui-border: rgb(255 255 255 / 0.2);
    --ui-border-accented: rgb(255 255 255 / 0.34);
    --ui-primary: var(--color-guide-500);
    --rule-color: rgb(255 255 255 / 0.2);
    --guide-color: rgb(255 255 255 / 0.07);
    border-bottom-color: transparent;
    background: #0a0a0a;
  }

  /* The guide lines run over the video and under the words. */
  .hero[data-video]::before {
    z-index: 1;
  }

  .hero[data-video] .hero__grid {
    position: relative;
    z-index: 2;
    padding-block: 2rem 1rem;
  }

  .hero[data-video] .hero__title-2 {
    color: rgb(255 255 255 / 0.62);
  }
}

/* ── The parts of the guide ──────────────────────────────────────────── */
.parts {
  margin-top: 3rem;
}

.part {
  padding-top: 1rem;
  border-top: 2px solid var(--rule-strong);
}

.part + .part {
  margin-top: 3.5rem;
}

.part__head,
.part__tracks {
  grid-column: 1 / -1;
}

.part__title {
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
}

.part__blurb {
  margin-top: 0.5rem;
  max-width: 34rem;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.part__tracks {
  margin-top: 1.5rem;
}

@media (min-width: 1024px) {
  .part__head {
    grid-column: 1 / span 3;
  }

  .part__tracks {
    grid-column: 4 / -1;
    margin-top: 0;
    border-top: 0;
  }
}

.track {
  display: grid;
  grid-template-columns: 2.25rem 0.625rem minmax(0, 1fr);
  column-gap: 0.75rem;
  align-items: baseline;
  padding: 0.875rem 0.5rem 0.875rem 0;
}

.track__n {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ui-text-dimmed);
}

.track__swatch {
  width: 0.625rem;
  height: 0.625rem;
  border: 1.5px solid var(--track);
}

.track[data-status='doing'] .track__swatch {
  background: linear-gradient(to top, var(--track) 50%, transparent 50%);
}

.track[data-status='done'] .track__swatch {
  background: var(--track);
}

.track__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.track__title {
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.25;
  color: var(--ui-text-highlighted);
}

.track:hover .track__title {
  color: var(--ui-primary);
}

.track__text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin-top: 0.25rem;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
}

.track__meta {
  grid-column: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  margin-top: 0.5rem;
  font-size: var(--text-xs);
  color: var(--ui-text-dimmed);
}

.track__progress {
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

@media (min-width: 768px) {
  .track {
    grid-template-columns: 2.25rem 0.625rem minmax(0, 1fr) 9rem;
  }

  .track__meta {
    grid-column: 4;
    flex-direction: column;
    align-items: flex-end;
    margin-top: 0;
    text-align: right;
  }
}

/* ── The quote and the author ────────────────────────────────────────── */
.quote,
.quote__author {
  grid-column: 1 / -1;
}

.quote__text {
  font-size: clamp(1.625rem, 1.1rem + 2vw, 2.75rem);
  line-height: 1.12;
  font-weight: 600;
  letter-spacing: -0.035em;
  color: var(--ui-text-highlighted);
  text-wrap: pretty;
}

.quote__author {
  margin-top: 4rem;
}

@media (min-width: 1024px) {
  .quote {
    grid-column: 1 / span 10;
  }
}

/* ── What next ───────────────────────────────────────────────────────── */
.next__text {
  margin-top: 1.5rem;
  max-width: 40rem;
  color: var(--ui-text-muted);
  text-wrap: pretty;
}

.next__text p + p {
  margin-top: 1rem;
}

.home__next {
  border-bottom: 0;
}

.band--thin {
  padding-block: 2rem;
}
</style>
