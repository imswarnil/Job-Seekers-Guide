<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

/**
 * The bar across the top of the app. Fixed, full width, one hairline under it.
 *
 * Left to right: the sidebar control and the brand (in a cell exactly as wide
 * as the sidebar, so the rest of the bar starts on the content's edge), the
 * search, the community pages, and who you are.
 *
 * The community links show as many as fit: all seven on a very wide screen,
 * fewer as it narrows, with the rest in "More". On a phone they all live in
 * the menu button. Which ones show is decided by CSS, so the right set is
 * there before the page has hydrated; the "More" menu reads the same
 * breakpoints to list exactly the ones that are hidden.
 */
const route = useRoute()
const { open, collapsed, toggle } = useRail()
const { open: openSearch } = useContentSearch()
const { user, ready, isAdmin, signOut } = useUser()

interface NavLink {
  label: string
  to: string
  icon: string
  /** The narrowest breakpoint at which it sits in the bar itself. */
  from: 'lg' | 'xl' | '2xl'
}

const links: NavLink[] = [
  { label: 'Stories', to: '/stories', icon: 'i-lucide-message-square-heart', from: 'lg' },
  { label: 'Guestbook', to: '/guestbook', icon: 'i-lucide-book-open-text', from: 'lg' },
  { label: 'Stats', to: '/stats', icon: 'i-lucide-chart-column', from: 'xl' },
  { label: 'Leaderboard', to: '/leaderboard', icon: 'i-lucide-trophy', from: 'xl' },
  { label: 'Gear', to: '/gear', icon: 'i-lucide-backpack', from: '2xl' },
  { label: 'Support', to: '/support', icon: 'i-lucide-heart-handshake', from: '2xl' },
  { label: 'Sponsor', to: '/sponsor', icon: 'i-lucide-megaphone', from: '2xl' }
]

const shownClass: Record<NavLink['from'], string> = {
  'lg': 'hidden lg:flex',
  'xl': 'hidden xl:flex',
  '2xl': 'hidden 2xl:flex'
}

const atLg = useMediaQuery('(min-width: 1024px)')
const atXl = useMediaQuery('(min-width: 1280px)')
const at2xl = useMediaQuery('(min-width: 1536px)')

function inBar(link: NavLink) {
  return link.from === 'lg' ? atLg.value : link.from === 'xl' ? atXl.value : at2xl.value
}

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

const more = computed<DropdownMenuItem[]>(() =>
  links
    .filter(link => !inBar(link))
    .map(link => ({
      label: link.label,
      icon: link.icon,
      to: link.to,
      active: isActive(link.to)
    }))
)

const signingOut = ref(false)

async function leave() {
  signingOut.value = true
  try {
    await signOut()
    await navigateTo('/')
  } finally {
    signingOut.value = false
  }
}

const menu = computed<DropdownMenuItem[][]>(() => {
  const u = user.value
  if (!u) {
    return []
  }
  const main: DropdownMenuItem[] = [
    { label: 'My account', icon: 'i-lucide-user-round', to: '/account' },
    { label: 'My stories', icon: 'i-lucide-message-square-heart', to: '/account' }
  ]
  if (isAdmin.value) {
    main.push({ label: 'Admin', icon: 'i-lucide-shield', to: '/admin' })
  }
  return [
    [{ type: 'label', label: u.name || 'Signed in', description: u.email, slot: 'who' as const }],
    main,
    [{ label: 'Sign out', icon: 'i-lucide-log-out', color: 'error', onSelect: () => { leave() } }]
  ]
})

const signInLink = computed(() => ({
  path: '/login',
  query: route.path === '/login' ? undefined : { next: route.fullPath }
}))

const isMac = ref(false)
onMounted(() => {
  isMac.value = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
})

const mounted = useMounted()
const folded = computed(() => mounted.value && collapsed.value)
</script>

<template>
  <header class="navbar">
    <div class="navbar__lead">
      <!-- A drawer below `lg`, a fold-away column above. Two buttons shown by
           CSS, so the right one is there before hydration. -->
      <UButton
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        aria-label="Open the guide"
        :aria-expanded="open"
        class="lg:hidden"
        @click="toggle()"
      />
      <UTooltip
        :text="folded ? 'Show the guide' : 'Hide the guide'"
        :kbds="['[']"
      >
        <UButton
          :icon="folded ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
          color="neutral"
          variant="ghost"
          :aria-label="folded ? 'Show the guide' : 'Hide the guide'"
          :aria-expanded="!folded"
          class="hidden lg:inline-flex"
          @click="toggle()"
        />
      </UTooltip>

      <NuxtLink
        to="/"
        class="navbar__brand"
        aria-label="Bangalore Job Seekers Guide, home"
      >
        <AppLogo
          compact
          class="navbar__logo-full"
        />
        <AppLogo
          mark-only
          class="navbar__logo-mark"
        />
      </NuxtLink>
    </div>

    <div class="navbar__main">
      <!-- Looks like an input because people click where they type. The
           palette does the searching. -->
      <button
        type="button"
        class="navbar__search"
        aria-label="Search the guide"
        @click="openSearch = true"
      >
        <UIcon
          name="i-lucide-search"
          class="size-4 shrink-0"
        />
        <span class="navbar__search-text">Search the guide</span>
        <span class="navbar__kbds">
          <UKbd value="/" />
          <ClientOnly>
            <UKbd :value="isMac ? 'meta' : 'ctrl'" />
            <UKbd value="k" />
          </ClientOnly>
        </span>
      </button>

      <span class="flex-1" />

      <UButton
        icon="i-lucide-search"
        color="neutral"
        variant="ghost"
        aria-label="Search the guide"
        class="md:hidden"
        @click="openSearch = true"
      />

      <nav
        class="navbar__nav"
        aria-label="Community"
      >
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="navbar__link"
          :class="shownClass[link.from]"
          :aria-current="isActive(link.to) ? 'page' : undefined"
        >
          {{ link.label }}
        </NuxtLink>

        <UDropdownMenu
          :items="more"
          :content="{ align: 'end', sideOffset: 6 }"
          :ui="{ content: 'w-52' }"
        >
          <button
            type="button"
            class="navbar__more"
            aria-label="More community pages"
          >
            <span class="hidden md:inline">More</span>
            <UIcon
              name="i-lucide-chevron-down"
              class="hidden md:inline size-3.5"
            />
            <UIcon
              name="i-lucide-layout-grid"
              class="md:hidden size-5"
            />
          </button>
        </UDropdownMenu>
      </nav>

      <ClientOnly>
        <UDropdownMenu
          v-if="user"
          :items="menu"
          :content="{ align: 'end', sideOffset: 6 }"
          :ui="{ content: 'w-60' }"
        >
          <button
            type="button"
            class="navbar__avatar"
            :aria-label="`Signed in as ${user.name}. Open the account menu`"
          >
            <UAvatar
              :src="user.image || undefined"
              :alt="user.name"
              size="sm"
            />
          </button>

          <template #who>
            <div class="flex items-center gap-2.5 min-w-0 py-0.5">
              <UAvatar
                :src="user.image || undefined"
                :alt="user.name"
                size="md"
              />
              <span class="min-w-0">
                <span class="block truncate text-sm font-semibold text-highlighted">{{ user.name }}</span>
                <span class="block truncate text-xs font-normal text-muted">{{ user.email }}</span>
              </span>
            </div>
          </template>
        </UDropdownMenu>

        <UButton
          v-else-if="ready"
          :to="signInLink"
          label="Sign in"
          color="neutral"
          variant="outline"
          size="sm"
          class="navbar__signin"
        />

        <USkeleton
          v-else
          class="size-8 rounded-full"
        />

        <template #fallback>
          <USkeleton class="size-8 rounded-full" />
        </template>
      </ClientOnly>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: relative;
  z-index: 30;
  display: flex;
  align-items: stretch;
  height: var(--navbar-h);
  border-bottom: 1px solid var(--rule-color);
  background: var(--ui-bg);
}

.navbar__lead {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: none;
  min-width: 0;
  padding-inline: 0.5rem;
}

/* On a wide screen the lead cell is exactly the sidebar's width, with the
   sidebar's rule continuing up through the bar. */
@media (min-width: 1024px) {
  .navbar__lead {
    width: var(--sidebar-w);
    border-right: 1px solid var(--rule-color);
    padding-inline: 0.5rem 1rem;
  }
}

.navbar__brand {
  display: inline-flex;
  min-width: 0;
  padding: 0.25rem;
}

.navbar__logo-full {
  display: none;
}

@media (min-width: 400px) {
  .navbar__logo-full {
    display: inline-flex;
  }

  .navbar__logo-mark {
    display: none;
  }
}

.navbar__main {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
  padding-inline: 0.25rem 0.5rem;
}

@media (min-width: 768px) {
  .navbar__main {
    gap: 0.5rem;
    padding-inline: var(--margin) 0.75rem;
  }
}

.navbar__search {
  display: none;
  align-items: center;
  gap: 0.5rem;
  width: min(22rem, 100%);
  min-width: 0;
  height: 2.25rem;
  padding-inline: 0.625rem 0.375rem;
  border: 1px solid var(--rule-color);
  background: var(--ui-bg);
  color: var(--ui-text-dimmed);
  font-size: var(--text-sm);
  text-align: left;
  transition:
    border-color var(--dgm-t-fast) var(--dgm-ease),
    color var(--dgm-t-fast) var(--dgm-ease);
}

.navbar__search:hover,
.navbar__search:focus-visible {
  border-color: var(--ui-text-highlighted);
  color: var(--ui-text-highlighted);
}

.navbar__search-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar__kbds {
  display: inline-flex;
  gap: 0.2rem;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .navbar__search {
    display: flex;
  }
}

.navbar__nav {
  display: flex;
  align-items: stretch;
  align-self: stretch;
}

/* A community link: small, quiet, and underlined in the accent where you are.
   The underline sits on the bar's own bottom rule. */
.navbar__link {
  position: relative;
  align-items: center;
  padding-inline: 0.625rem;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ui-text-muted);
  white-space: nowrap;
  transition: color var(--dgm-t-fast) var(--dgm-ease);
}

.navbar__link:hover {
  color: var(--ui-text-highlighted);
}

.navbar__link[aria-current='page'] {
  color: var(--ui-text-highlighted);
}

.navbar__link[aria-current='page']::after {
  content: '';
  position: absolute;
  left: 0.625rem;
  right: 0.625rem;
  bottom: -1px;
  height: 2px;
  background: var(--ui-primary);
}

.navbar__link:focus-visible,
.navbar__more:focus-visible {
  outline-offset: -2px;
}

.navbar__more {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding-inline: 0.625rem;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ui-text-muted);
  transition: color var(--dgm-t-fast) var(--dgm-ease);
}

.navbar__more:hover,
.navbar__more[data-state='open'] {
  color: var(--ui-text-highlighted);
}

/* Every link fits from here, so there is nothing left to put in "More". */
@media (min-width: 1536px) {
  .navbar__more {
    display: none;
  }
}

.navbar__avatar {
  display: inline-flex;
  flex-shrink: 0;
  margin-left: 0.25rem;
  border-radius: 999px;
}

.navbar__signin {
  flex-shrink: 0;
  margin-left: 0.25rem;
}
</style>
