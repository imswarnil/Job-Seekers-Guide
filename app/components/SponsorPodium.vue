<script setup lang="ts">
/**
 * The leaderboard: every sponsor there has ever been, ranked by all they have
 * paid. It is the `#leaderboard` section of /sponsor (it was a page of its own
 * at /leaderboard, which now redirects there).
 *
 * The first three stand on a podium, the way a race ends: first in the middle
 * and tallest, second on the left, third on the right (on a phone they stack
 * in order). A step nobody has earned yet says so and links to the bid.
 * Everybody from fourth down is a ruled list underneath.
 *
 * Two things are measured here and they are not the same. This list ranks by
 * everything a sponsor has ever paid. The sponsor spot is held by the highest
 * single bid, and its holder is the site sponsor. They are nearly always the
 * same name, but when they are not, "Site sponsor" follows the spot (`slots`
 * from the API), because that is whose card the site is showing.
 */
interface Sponsor {
  rank: number
  name: string
  url: string
  image: string | null
  /** Who they are, from their latest paid bid: creator, builder or company. */
  type?: 'creator' | 'builder' | 'company' | string
  total: number
  slots: string[]
  since: string
}

const { data, status } = useFetch<{ items: Sponsor[] }>('/api/sponsors/leaderboard', {
  server: false,
  lazy: true,
  default: () => ({ items: [] })
})

const isWeb = (v?: string | null) => Boolean(v && /^https?:\/\//i.test(v))

/** The badge word for each kind of sponsor; the same words the cards use. */
const TYPE_BADGE: Record<string, string> = { creator: 'Creator', builder: 'Project', company: 'Sponsor' }
const badge = (s: Sponsor) => TYPE_BADGE[s.type || 'company'] || 'Sponsor'

/** "example.com", for the link under a name. */
function host(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Holds the one live spot, `brand`. Bids on the retired slot names can still
 * come back in `slots`, and they hold nothing the site shows.
 */
const holdsSpot = (s: Sponsor) => s.slots.includes('brand')

const loading = computed(() => status.value === 'pending' || status.value === 'idle')

/** The three steps, always three: a sponsor, or null for a step that is open. */
const podium = computed(() => [1, 2, 3].map(rank => ({
  rank,
  sponsor: data.value?.items.find(s => s.rank === rank) ?? null
})))

const rest = computed(() => (data.value?.items ?? []).filter(s => s.rank > 3))
</script>

<template>
  <div class="podium-wrap">
    <div
      v-if="loading"
      class="grid gap-3 sm:grid-cols-3 sm:items-end"
    >
      <USkeleton class="h-28 w-full sm:order-2 sm:h-80" />
      <USkeleton class="h-28 w-full sm:order-1 sm:h-64" />
      <USkeleton class="h-28 w-full sm:order-3 sm:h-56" />
    </div>

    <template v-else>
      <ol class="podium">
        <li
          v-for="step in podium"
          :key="step.rank"
          class="podium__step"
          :data-rank="step.rank"
          :data-open="step.sponsor ? undefined : ''"
        >
          <div class="podium__who">
            <span class="sr-only">Place {{ step.rank }}</span>
            <template v-if="step.sponsor">
              <p
                v-if="holdsSpot(step.sponsor)"
                class="label podium__flag"
              >
                <span class="mark" />
                Site sponsor
              </p>
              <UAvatar
                :src="isWeb(step.sponsor.image) ? step.sponsor.image! : undefined"
                :alt="step.sponsor.name"
                :size="step.rank === 1 ? 'xl' : 'lg'"
                class="podium__avatar"
              />
              <p class="podium__name">
                {{ step.sponsor.name }}
              </p>
              <p>
                <span
                  class="board__type label"
                  :data-type="step.sponsor.type || 'company'"
                >{{ badge(step.sponsor) }}</span>
              </p>
              <p class="podium__total num">
                {{ formatPaise(step.sponsor.total) }}
              </p>
              <p class="podium__since">
                Since {{ formatDay(step.sponsor.since) }}
              </p>
              <a
                v-if="isWeb(step.sponsor.url)"
                :href="step.sponsor.url"
                target="_blank"
                rel="sponsored noopener"
                class="podium__link"
              >
                <span class="truncate">{{ host(step.sponsor.url) || 'Visit' }}</span>
                <UIcon
                  name="i-lucide-arrow-up-right"
                  class="size-3.5 shrink-0"
                />
              </a>
            </template>

            <NuxtLink
              v-else
              to="/sponsor#sponsor"
              class="podium__open"
            >
              <span class="podium__open-title">This step is open</span>
              <span class="podium__open-go">
                Take it
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-3.5"
                />
              </span>
            </NuxtLink>
          </div>

          <div
            class="podium__block"
            aria-hidden="true"
          >
            <span class="podium__numeral num">{{ step.rank }}</span>
          </div>
        </li>
      </ol>

      <p
        v-if="!data?.items.length"
        class="mt-6 text-sm text-muted"
      >
        Nobody has sponsored the guide yet. The first name here stays near the
        top for a long time.
      </p>

      <template v-if="rest.length">
        <h3 class="label mt-14 mb-3">
          Everybody else
        </h3>
        <ol
          class="board"
          start="4"
        >
          <li
            v-for="s in rest"
            :key="s.rank"
            class="board__row"
          >
            <span class="board__rank">{{ s.rank }}</span>
            <UAvatar
              :src="isWeb(s.image) ? s.image! : undefined"
              :alt="s.name"
              size="md"
            />
            <div class="min-w-0 flex-1">
              <p class="flex min-w-0 items-baseline gap-2">
                <a
                  v-if="isWeb(s.url)"
                  :href="s.url"
                  target="_blank"
                  rel="sponsored noopener"
                  class="font-semibold text-highlighted hover:text-primary truncate"
                >{{ s.name }}</a>
                <span
                  v-else
                  class="font-semibold text-highlighted truncate"
                >{{ s.name }}</span>
                <span
                  class="board__type label"
                  :data-type="s.type || 'company'"
                >{{ badge(s) }}</span>
              </p>
              <p class="text-xs text-muted">
                Since {{ formatDay(s.since) }}
                <template v-if="holdsSpot(s)">
                  · <span class="text-primary font-semibold">site sponsor now</span>
                </template>
              </p>
            </div>
            <span class="font-semibold tabular-nums text-highlighted">{{ formatPaise(s.total) }}</span>
          </li>
        </ol>
      </template>
    </template>
  </div>
</template>

<style scoped>
/* ── The podium ──────────────────────────────────────────────────────────
   Three flat steps standing on one heavy rule. Each step is a person (who
   they are, what they gave) on top of a block with the place cut into it.
   The markup is in order, 1, 2, 3; the grid moves first place to the middle
   on a wide screen, and a phone reads them straight down. */
.podium {
  display: grid;
  border-bottom: 2px solid var(--rule-strong);
}

.podium__step {
  --block-h: 5rem;

  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  min-width: 0;
  border-top: 1px solid var(--rule-color);
}

.podium__who {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.375rem;
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  padding: 1rem 0 1rem 1rem;
}

.podium__block {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  grid-column: 1;
  grid-row: 1;
  padding-top: 0.75rem;
  border-inline: 1px solid var(--rule-color);
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.podium__numeral {
  font-family: var(--font-display);
  font-size: 3rem;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.05em;
}

/* First place is the one block drawn in the accent. */
.podium__step[data-rank='1'] .podium__block {
  border-color: var(--ui-primary);
  background: var(--ui-primary);
  color: var(--ui-text-inverted);
}

/* A step nobody stands on: an outline, and a quieter number. */
.podium__step[data-open] .podium__block {
  background: transparent;
  color: var(--ui-text-dimmed);
}

.podium__step[data-open][data-rank='1'] .podium__block {
  color: var(--ui-primary);
}

.podium__flag {
  color: var(--ui-primary);
}

.podium__name {
  font-size: 1.125rem;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.podium__step[data-rank='1'] .podium__name {
  font-size: 1.375rem;
}

.podium__total {
  font-size: 1.25rem;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ui-text-highlighted);
}

.podium__step[data-rank='1'] .podium__total {
  font-size: 1.625rem;
}

.podium__since {
  font-size: var(--text-xs);
  color: var(--ui-text-muted);
}

.podium__link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ui-text-highlighted);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.podium__link:hover {
  color: var(--ui-primary);
}

.podium__open {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  align-items: inherit;
}

.podium__open-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ui-text-muted);
}

.podium__open-go {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ui-primary);
}

.podium__open:hover .podium__open-title {
  color: var(--ui-text-highlighted);
}

@media (min-width: 640px) {
  .podium {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: var(--gutter);
    align-items: end;
  }

  .podium__step {
    display: flex;
    flex-direction: column;
    grid-row: 1;
    border-top: 0;
    text-align: center;
  }

  .podium__step[data-rank='1'] {
    --block-h: 13rem;

    grid-column: 2;
  }

  .podium__step[data-rank='2'] {
    --block-h: 9rem;

    grid-column: 1;
  }

  .podium__step[data-rank='3'] {
    --block-h: 6rem;

    grid-column: 3;
  }

  .podium__who {
    align-items: center;
    padding: 0 0.5rem 1rem;
  }

  .podium__block {
    height: var(--block-h);
    padding-top: 1rem;
    border: 1px solid var(--rule-color);
    border-bottom: 0;
  }

  .podium__step[data-rank='1'] .podium__block {
    border-color: var(--ui-primary);
  }

  .podium__numeral {
    font-size: 4rem;
  }

  .podium__step[data-rank='1'] .podium__numeral {
    font-size: 6.5rem;
  }
}

/* The rise: each block comes up out of the ground and the person appears on
   it, third place first and the winner last. Only for readers who have not
   asked for less motion; for them it is all in place from the start. */
@media (prefers-reduced-motion: no-preference) {
  .podium__block {
    animation: podium-rise 560ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
    animation-delay: var(--rise-delay, 0ms);
  }

  .podium__who {
    animation: podium-arrive 360ms ease-out both;
    animation-delay: calc(var(--rise-delay, 0ms) + 320ms);
  }

  .podium__step[data-rank='2'] {
    --rise-delay: 140ms;
  }

  .podium__step[data-rank='1'] {
    --rise-delay: 280ms;
  }
}

@keyframes podium-rise {
  from {
    clip-path: inset(100% 0 0 0);
  }

  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes podium-arrive {
  from {
    opacity: 0;
    transform: translateY(0.75rem);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

/* ── Everybody from fourth place down, as a ruled table ──────────────── */
.board {
  border-top: 2px solid var(--rule-strong);
}

.board__row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--rule-color);
}

.board__rank {
  width: 2.5rem;
  flex-shrink: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ui-text-dimmed);
  font-variant-numeric: tabular-nums;
}

/* Who each sponsor is, as a quiet bordered word beside the name. */
.board__type {
  flex-shrink: 0;
  padding: 0.0625rem 0.3125rem;
  border: 1px solid var(--ui-border-accented);
  font-size: 0.625rem;
  color: var(--ui-text-muted);
}

.board__type[data-type='creator'] {
  border-color: var(--ui-primary);
  color: var(--ui-primary);
}

.board__type[data-type='builder'] {
  color: var(--ui-text-highlighted);
  border-color: var(--ui-text-highlighted);
}
</style>
