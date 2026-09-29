import type { PageMeta } from '~/utils/path'

/**
 * The one place the guide is fetched. `app.vue` and `error.vue` both need the
 * whole tree, so both call this.
 */
export async function useProvideContent() {
  // Both fetches start before either is awaited, so they run in parallel and
  // the Nuxt instance is still available for the second.
  const navigationData = useAsyncData(
    'path-navigation',
    () => queryCollectionNavigation('path', ['description', 'icon', 'duration', 'stage', 'minutes', 'kind'])
  )

  const pagesData = useAsyncData(
    'path-pages',
    () => queryCollection('path')
      .select('path', 'title', 'description', 'icon', 'duration', 'stage', 'minutes', 'kind')
      .all() as Promise<PageMeta[]>
  )

  // Search covers every lesson, section by section, so "deadlock" lands on the
  // heading rather than the top of a long page.
  const { data: files } = useLazyAsyncData('search', () => queryCollectionSearchSections('path'), { server: false })

  const navigation = navigationData.data
  const pages = pagesData.data

  // Provide before awaiting: `provide` needs the component instance, which is
  // gone on the far side of an `await`.
  provide('path-navigation', navigation)
  provide('path-pages', pages)

  await Promise.all([navigationData, pagesData])

  return { navigation, pages, files }
}
