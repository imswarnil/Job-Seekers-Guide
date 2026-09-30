<script setup lang="ts">
import { footLinks } from '~/utils/links'

/**
 * The guide's navigation.
 *
 * The search and the account live in the top bar (AppNavbar). The sidebar
 * carries the brand, where you left off, the guide itself in order, and then
 * the community: the people reading it, and the ways to keep it going.
 * Everything else (privacy, terms, contact) is a line of small links at the
 * foot, because it is needed once.
 */
const props = defineProps<{
  current?: string
}>()

const community = [
  { label: 'Stories', to: '/stories', icon: 'i-lucide-message-square-heart' },
  { label: 'Guestbook', to: '/guestbook', icon: 'i-lucide-book-open-text' },
  { label: 'Leaderboard', to: '/leaderboard', icon: 'i-lucide-trophy' },
  { label: 'Live stats', to: '/stats', icon: 'i-lucide-chart-column' },
  { label: 'Gear I use', to: '/gear', icon: 'i-lucide-backpack' },
  { label: 'Support', to: '/support', icon: 'i-lucide-heart-handshake' },
  { label: 'Become a sponsor', to: '/sponsor', icon: 'i-lucide-megaphone' }
]

function isActive(to: string) {
  const here = props.current || ''
  return here === to || here.startsWith(`${to}/`)
}

const emit = defineEmits<{ navigate: [] }>()

const { path } = usePath()
const { state, pathProgress, resume } = useProgress()

const progress = computed(() => pathProgress(path.value))
const next = computed(() => resume(path.value))
</script>

<template>
  <!-- One scroll for the whole sidebar, not a scrolling box inside it: the
       brand scrolls away, the rail follows, then the community, then the red
       band that ends the sidebar. -->
  <div class="sidebar flex flex-col h-full overflow-y-auto overscroll-contain">
    <div class="px-3 pt-4 pb-3">
      <NuxtLink
        to="/"
        class="block rounded-md px-1 py-1 -mx-1"
        aria-label="Bangalore Job Seekers Guide, home"
        @click="emit('navigate')"
      >
        <AppLogo />
      </NuxtLink>

      <ClientOnly>
        <div class="mt-4 space-y-3">
          <NuxtLink
            v-if="next"
            :to="next.path"
            class="continue card-hover"
            @click="emit('navigate')"
          >
            <UIcon
              name="i-lucide-play"
              class="size-3.5 text-primary shrink-0"
            />
            <span class="min-w-0">
              <span class="block text-xs uppercase tracking-wider text-dimmed">
                {{ state.lastVisited ? 'Continue' : 'Start here' }}
              </span>
              <span class="block truncate text-sm text-highlighted">{{ next.title }}</span>
            </span>
          </NuxtLink>

          <PlayerProgress
            v-if="progress.started"
            :progress="progress"
          />
        </div>
      </ClientOnly>
    </div>

    <div class="flex-1 px-3 pb-6 border-t border-default pt-4">
      <NuxtLink
        to="/"
        class="home-link"
        :class="current === '/' && 'home-link--active'"
        @click="emit('navigate')"
      >
        <UIcon
          name="i-lucide-house"
          class="size-4 shrink-0"
        />
        Home
      </NuxtLink>

      <PlayerRail
        :current="current"
        class="mt-4"
        @navigate="emit('navigate')"
      />

      <!-- The community, after the guide: the people reading it and the ways
           to keep it going. Same heading style as the guide's parts. -->
      <nav
        aria-label="Community"
        class="mt-5"
      >
        <div class="flex items-center gap-2 px-2 mb-1.5">
          <UIcon
            name="i-lucide-users"
            class="size-3.5 text-dimmed shrink-0"
          />
          <h2 class="text-xs font-semibold uppercase tracking-[0.14em] text-dimmed whitespace-nowrap">
            Community
          </h2>
          <span class="h-px flex-1 bg-[var(--ui-border)]" />
        </div>

        <ul class="space-y-px">
          <li
            v-for="item in community"
            :key="item.to"
          >
            <NuxtLink
              :to="item.to"
              class="home-link"
              :class="isActive(item.to) && 'home-link--active'"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              @click="emit('navigate')"
            >
              <UIcon
                :name="item.icon"
                class="size-4 shrink-0"
              />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>

    <!-- The sidebar ends in red: the one ask this app makes, said once and
         kept short, at the bottom of the navigation. -->
    <div class="support">
      <div class="flex items-center justify-between gap-2">
        <p class="support__title">
          <UIcon
            name="i-lucide-heart-handshake"
            class="size-4 shrink-0"
          />
          Free, no paywall
        </p>
        <NuxtLink
          to="/support"
          class="support__button support__button--solid"
          @click="emit('navigate')"
        >
          Support
        </NuxtLink>
      </div>

      <div class="support__foot">
        <div class="flex flex-wrap gap-x-3 gap-y-1">
          <NuxtLink
            v-for="link in footLinks"
            :key="link.label"
            :to="link.to"
            :target="link.target"
            class="support__link"
            @click="emit('navigate')"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <UColorModeButton
          size="xs"
          color="neutral"
          variant="ghost"
          class="support__mode"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  scrollbar-width: thin;
}

/* A fixed red, not `--ui-primary`: in dark mode the primary lightens to a
   pink that white text cannot sit on. 700 carries small white text at a
   comfortable contrast in both modes. */
.support {
  padding: 0.625rem 0.875rem 0.5rem;
  color: #fff;
  background:
    radial-gradient(16rem 8rem at 0% 0%, rgb(255 255 255 / 0.14), transparent 70%),
    linear-gradient(160deg, var(--color-guide-600), var(--color-guide-800));
}

.support__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--text-sm);
}

.support__button {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid rgb(255 255 255 / 0.55);
  font-size: var(--text-xs);
  font-weight: 600;
  color: #fff;
  transition: background-color var(--dgm-t-fast) var(--dgm-ease);
}

.support__button:hover {
  background: rgb(255 255 255 / 0.14);
}

.support__button--solid {
  border-color: #fff;
  background: #fff;
  color: var(--color-guide-700);
}

.support__button--solid:hover {
  background: rgb(255 255 255 / 0.9);
}

.support__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.375rem;
  border-top: 1px solid rgb(255 255 255 / 0.22);
}

.support__link {
  font-size: var(--text-xs);
  color: rgb(255 255 255 / 0.85);
  transition: color var(--dgm-t-fast) var(--dgm-ease);
}

.support__link:hover {
  color: #fff;
  text-decoration: underline;
}

.support__mode {
  color: #fff;
}

.support__mode:hover {
  background: rgb(255 255 255 / 0.16);
}

.continue {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-left: 3px solid var(--ui-primary);
  background: var(--ui-bg-elevated);
}

.home-link {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ui-text-muted);
  transition: background-color var(--dgm-t-fast) var(--dgm-ease), color var(--dgm-t-fast) var(--dgm-ease);
}

.home-link:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.home-link--active {
  color: var(--ui-primary);
  background: color-mix(in oklab, var(--ui-primary) 10%, transparent);
}
</style>
