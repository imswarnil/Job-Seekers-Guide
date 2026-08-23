<script setup lang="ts">
/**
 * The "a human wrote this" badge, in the column beside a lesson.
 *
 * It is a third-party widget: a single external script that draws its own
 * certificate wherever it finds itself. Everything it needs arrives as
 * `data-` attributes, and every one of them is in `app.config.ts` so the
 * wording can change without touching code.
 *
 * Why the script is built here rather than written into the template: Vue
 * strips `<script>` out of a component template, and `useHead` would put it in
 * the document head, where the widget has no container to render into. Built
 * in the DOM and appended to the box below, `document.currentScript` — which
 * is what a badge like this uses to find its home — points at an element
 * inside the sidebar.
 */
const { authorBadge } = useAppConfig()

const host = useTemplateRef<HTMLElement>('host')

const shown = computed(() => Boolean(authorBadge?.enabled && authorBadge.src?.trim()))

onMounted(() => {
  const el = host.value
  // Appending twice — a hot reload, a remount — gives the reader two badges,
  // so an already-populated box is left exactly as it is.
  if (!shown.value || !el || el.childElementCount) {
    return
  }

  const script = document.createElement('script')
  script.src = authorBadge.src.trim()
  script.async = true
  script.dataset.author = authorBadge.author
  script.dataset.message = authorBadge.message
  script.dataset.style = authorBadge.style
  script.dataset.theme = authorBadge.theme
  script.dataset.region = authorBadge.region
  script.dataset.category = authorBadge.category

  // A widget that fails to load is not worth breaking a lesson over. The box
  // is empty and has no border of its own, so a failure leaves no hole.
  script.addEventListener('error', () => {
    console.warn('[AuthorBadge] widget failed to load from', script.src)
  })

  el.appendChild(script)
})
</script>

<template>
  <div
    v-if="shown"
    ref="host"
    class="author-badge"
  />
</template>

<style scoped>
/* No border, no padding, no label. The widget draws a certificate of its own,
   and a frame around a frame reads as a mistake. The column sets the gaps, and
   a box holding nothing but a `<script>` has no height, so a widget that never
   loads leaves no hole to explain. */

/* The certificate is built with inline styles and sized for a page, not for a
   250px column. Nothing it draws is allowed to push the sidebar wider. */
.author-badge :deep(*) {
  max-width: 100%;
}
</style>
