<script setup lang="ts">
/** Every sponsor there has ever been, ranked by all they have paid, with the spots they hold now. */
interface Sponsor {
  rank: number
  name: string
  url: string
  image: string | null
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

usePageSeo({
  title: 'Sponsors of all time',
  description: 'Everybody who has paid to keep the Bangalore Job Seekers Guide free, ranked by what they have given.',
  headline: 'Leaderboard'
})
</script>

<template>
  <CommunityPage
    kicker="Leaderboard"
    icon="i-lucide-trophy"
    title="Sponsors of all time"
    description="The companies and people who have paid to keep this guide free, ranked by everything they have put in. A spot on the site can be outbid. A place on this list cannot."
  >
    <template #actions>
      <UButton
        to="/sponsor"
        icon="i-lucide-megaphone"
      >
        Become a sponsor
      </UButton>
    </template>

    <div
      v-if="status === 'pending' || status === 'idle'"
      class="space-y-3"
    >
      <USkeleton
        v-for="n in 5"
        :key="n"
        class="h-16 w-full"
      />
    </div>

    <UEmpty
      v-else-if="!data?.items.length"
      icon="i-lucide-trophy"
      title="The first place is open"
      description="Nobody has sponsored the guide yet. The first name here stays near the top for a long time."
      :actions="[{ label: 'Take a spot', to: '/sponsor', icon: 'i-lucide-megaphone' }]"
    />

    <ol
      v-else
      class="board"
    >
      <li
        v-for="s in data.items"
        :key="s.rank"
        class="board__row"
        :data-rank="s.rank <= 3 ? s.rank : undefined"
      >
        <span class="board__rank">{{ s.rank }}</span>
        <UAvatar
          :src="isWeb(s.image) ? s.image! : undefined"
          :alt="s.name"
          size="md"
        />
        <div class="min-w-0 flex-1">
          <a
            v-if="isWeb(s.url)"
            :href="s.url"
            target="_blank"
            rel="sponsored noopener"
            class="font-semibold text-highlighted hover:text-primary truncate block"
          >{{ s.name }}</a>
          <span
            v-else
            class="font-semibold text-highlighted truncate block"
          >{{ s.name }}</span>
          <p class="text-xs text-muted">
            Since {{ formatDay(s.since) }}
            <template v-if="s.slots.length">
              · holds
              <UBadge
                v-for="slot in s.slots"
                :key="slot"
                size="sm"
                variant="subtle"
                class="ml-1"
              >
                {{ slot }}
              </UBadge>
            </template>
          </p>
        </div>
        <span class="font-semibold tabular-nums text-highlighted">{{ formatPaise(s.total) }}</span>
      </li>
    </ol>
  </CommunityPage>
</template>

<style scoped>
/* The leaderboard as a ruled table: rank, who, since, total. */
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

.board__row[data-rank] .board__rank {
  color: var(--ui-text-highlighted);
}

.board__row[data-rank='1'] .board__rank {
  color: var(--ui-primary);
}
</style>
