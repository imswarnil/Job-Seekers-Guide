/**
 * "Products I use", from `content/products.yml`. Fetched once under one key,
 * so /gear, the home shelf and the shelf under every lesson share the result.
 */
export function useProducts() {
  const { data } = useAsyncData('products', () => queryCollection('products').first())

  const products = computed(() => data.value?.items || [])

  /**
   * A few items for a shelf: the ones tagged for this track first, then the
   * rest in file order, so the Java book leads under a Java lesson and the
   * shelf is never empty.
   */
  function pick(track: string | undefined, limit: number) {
    const all = products.value
    const tagged = track ? all.filter(item => item.tracks?.includes(track)) : []
    const rest = all.filter(item => !tagged.includes(item))
    return [...tagged, ...rest].slice(0, limit)
  }

  return { products, pick }
}

export type Product = ReturnType<typeof useProducts>['products']['value'][number]
