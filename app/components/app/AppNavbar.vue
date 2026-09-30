<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

/**
 * The bar across the top of every page. Slim, square, and only three jobs:
 * find something (the search), move along the path (previous and next, on a
 * lesson), and say who you are (the avatar, or "Sign in").
 *
 * The sidebar still carries the guide itself. This bar replaced the search box
 * that used to sit in it, the narrow-screen bar, and the fold button that was
 * pinned to the corner of the page, which were three controls doing one bar's
 * work.
 */
const route = useRoute()
const { open, collapsed } = useRail()
const { open: openSearch } = useContentSearch()
const { user, ready, isAdmin, signOut } = useUser()

const { lesson, previous, next } = usePathPlayer(() => route.path)

/** Previous / next only make sense on a lesson: depth three, and in the path. */
const onLesson = computed(() => route.path.split('/').filter(Boolean).length >= 3 && Boolean(lesson.value))

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
</script>

<template>
  <header class="navbar">
    <!-- The sidebar control: a slideover below `lg`, a fold-away column
         above. Two buttons shown by CSS rather than one switched in script, so
         the right one is there before the page has hydrated. -->
    <UButton
      icon="i-lucide-menu"
      color="neutral"
      variant="ghost"
      aria-label="Open the guide"
      :aria-expanded="open"
      class="lg:hidden"
      @click="open = true"
    />
    <UTooltip
      :text="collapsed ? 'Show the guide' : 'Hide the guide'"
      :kbds="['[']"
    >
      <UButton
        :icon="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
        color="neutral"
        variant="ghost"
        :aria-label="collapsed ? 'Show the guide' : 'Hide the guide'"
        :aria-expanded="!collapsed"
        class="hidden lg:inline-flex"
        @click="collapsed = !collapsed"
      />
    </UTooltip>

    <!-- The brand, where the sidebar is not showing it. -->
    <NuxtLink
      to="/"
      class="navbar__brand"
      :data-show="collapsed ? '' : undefined"
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

    <!-- A real-looking input that opens the palette. The palette does the
         searching; this is where people expect to click to start. -->
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
      class="navbar__search-icon"
      @click="openSearch = true"
    />

    <!-- Previous and next along the whole path, on a lesson only. -->
    <nav
      v-if="onLesson"
      class="navbar__steps"
      aria-label="Previous and next lesson"
    >
      <UTooltip
        :text="previous ? `Previous: ${previous.title}` : 'This is the first lesson'"
        :kbds="previous ? ['k'] : undefined"
      >
        <UButton
          :to="previous?.path"
          :disabled="!previous"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
          size="sm"
          aria-label="Previous lesson"
          class="navbar__step"
        >
          <span class="navbar__step-label">Previous</span>
        </UButton>
      </UTooltip>
      <UTooltip
        :text="next ? `Next: ${next.title}` : 'That is the last lesson'"
        :kbds="next ? ['j'] : undefined"
      >
        <UButton
          :to="next?.path || '/'"
          trailing-icon="i-lucide-arrow-right"
          color="primary"
          variant="solid"
          size="sm"
          :aria-label="next ? 'Next lesson' : 'Back to the start'"
          class="navbar__step"
        >
          <span class="navbar__step-label">{{ next ? 'Next' : 'Finish' }}</span>
        </UButton>
      </UTooltip>
    </nav>

    <!-- Who you are. Browser only: the page is prerendered for nobody. -->
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
        icon="i-lucide-log-in"
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
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  height: var(--ui-header-height);
  padding-inline: 0.5rem;
  border-bottom: 1px solid var(--ui-border);
  background: color-mix(in oklab, var(--ui-bg) 90%, transparent);
  backdrop-filter: blur(10px);
}

@media (min-width: 640px) {
  .navbar {
    gap: 0.5rem;
    padding-inline: 0.75rem;
  }
}

/* The brand: always on a phone (the sidebar is hidden there), and on a wide
   screen only once the sidebar, which carries it, has been folded away. */
.navbar__brand {
  display: inline-flex;
  min-width: 0;
  margin-right: 0.25rem;
}

.navbar__logo-full {
  display: none;
}

@media (min-width: 480px) {
  .navbar__logo-full {
    display: inline-flex;
  }

  .navbar__logo-mark {
    display: none;
  }
}

@media (min-width: 1024px) {
  .navbar__brand {
    display: none;
  }

  .navbar__brand[data-show] {
    display: inline-flex;
  }
}

/* The search looks like an input, because people click where they type. */
.navbar__search {
  display: none;
  align-items: center;
  gap: 0.5rem;
  width: min(26rem, 100%);
  min-width: 0;
  height: 2.25rem;
  padding-inline: 0.625rem 0.375rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-md);
  background: var(--ui-bg);
  color: var(--ui-text-dimmed);
  font-size: var(--text-sm);
  text-align: left;
  transition:
    border-color var(--dgm-t-fast) var(--dgm-ease),
    color var(--dgm-t-fast) var(--dgm-ease),
    box-shadow var(--dgm-t-fast) var(--dgm-ease);
}

.navbar__search:hover,
.navbar__search:focus-visible {
  border-color: var(--ui-text-highlighted);
  color: var(--ui-text-highlighted);
  box-shadow: 3px 3px 0 0 var(--ui-primary);
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

.navbar__search-icon {
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .navbar__search {
    display: flex;
  }

  .navbar__search-icon {
    display: none;
  }
}

.navbar__steps {
  display: inline-flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

/* Icon-only on a phone, labelled once there is room. */
.navbar__step-label {
  display: none;
}

@media (min-width: 640px) {
  .navbar__step-label {
    display: inline;
  }
}

.navbar__avatar {
  display: inline-flex;
  flex-shrink: 0;
  margin-left: 0.125rem;
  border-radius: 999px;
  outline-offset: 2px;
  transition: box-shadow var(--dgm-t-fast) var(--dgm-ease);
}

.navbar__avatar:hover {
  box-shadow: 0 0 0 2px var(--ui-primary);
}

.navbar__signin {
  flex-shrink: 0;
}
</style>
