<script setup lang="ts">
/**
 * The rendering for /privacy, /terms and /contact.
 *
 * One component rather than three near-identical pages, because the only thing
 * that differs between them is which markdown file is read. Each of those
 * routes still needs its own file under `app/pages/` — that is what reserves
 * the slug from the learning path, which lives at the root of the site.
 *
 * These pages carry no ad slot, on purpose. A privacy page that explains the
 * advertising while running an advert next to it undercuts itself, and the ads
 * are already paying for the site elsewhere.
 */
const props = defineProps<{
  /** Route path of the markdown file in the `pages` collection, e.g. `/privacy`. */
  path: string
  /** Small line above the title on the social card. */
  headline?: string
}>()

const { data: page } = await useAsyncData(`page:${props.path}`, () =>
  queryCollection('pages').path(props.path).first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

usePageSeo({
  title: page.value.seo?.title || page.value.title,
  description: page.value.seo?.description || page.value.description,
  headline: props.headline
})

/**
 * The date the page itself declares, not the git timestamp.
 *
 * "Last updated" is the first thing anybody checks on a privacy policy, and a
 * date that moves because a typo was fixed is worse than no date — it claims a
 * review that did not happen. So it is written in the front matter by hand, and
 * only changes when the meaning does.
 */
const updated = computed(() => {
  const value = page.value?.updated
  if (!value) {
    return null
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value))
})

const others = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Contact', to: '/contact' }
]
</script>

<template>
  <div
    v-if="page"
    class="legal"
  >
    <header class="legal__band guides">
      <div class="frame swiss-grid">
        <div class="legal__head">
          <p class="label">
            <span class="mark" /> {{ headline || 'About this site' }}
          </p>
          <h1 class="headline mt-4">
            {{ page.title }}
          </h1>
          <p
            v-if="page.description"
            class="lede mt-4"
          >
            {{ page.description }}
          </p>
          <p
            v-if="updated"
            class="legal__updated num"
          >
            Last updated {{ updated }}
          </p>
        </div>
      </div>
    </header>

    <div class="legal__page guides">
      <div class="frame swiss-grid">
        <div class="legal__body">
          <div class="guide-prose">
            <ContentRenderer :value="page" />
          </div>

          <!-- The other two, at the bottom, because somebody who has read one
               of these is usually looking for another. -->
          <nav
            class="legal__siblings row-list"
            aria-label="Other pages"
          >
            <NuxtLink
              v-for="other in others.filter(item => item.to !== path)"
              :key="other.to"
              :to="other.to"
              class="legal__sibling row-link"
            >
              {{ other.label }}
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4"
              />
            </NuxtLink>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legal__band {
  padding-block: 2.5rem 2rem;
  border-bottom: 1px solid var(--rule-color);
}

.legal__head,
.legal__body {
  grid-column: 1 / -1;
  min-width: 0;
}

.legal__updated {
  margin-top: 1.5rem;
  font-size: var(--text-xs);
  color: var(--ui-text-dimmed);
}

.legal__page {
  padding-block: 2.5rem 5rem;
}

.legal__siblings {
  margin-top: 4rem;
  max-width: 28rem;
}

.legal__sibling {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.5rem 0.75rem 0;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

/* Narrower than the lessons: dense prose somebody scans for one clause. */
@media (min-width: 1024px) {
  .legal__band {
    padding-block: 4rem 2.5rem;
  }

  .legal__head {
    grid-column: 1 / span 8;
  }

  .legal__body {
    grid-column: 1 / span 7;
  }
}
</style>
