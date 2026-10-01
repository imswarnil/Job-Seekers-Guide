<script setup lang="ts">
/**
 * The reading surface, on the grid.
 *
 *   header band   the title block, full frame width, a rule under it
 *   body band     the page on columns 1–8, the column beside it on 9–12
 *   pager         the lesson bar, stuck to the bottom of the content pane
 *
 * Both bands carry the column guide lines. Below `xl` the side column drops
 * under the page (its table of contents is replaced by the compact one above
 * the prose).
 *
 * The side column's widgets pin in sequence. Every direct child of the aside
 * is `position: sticky`; this component measures them and staggers each one's
 * `top` so the contents pins first, the author card arrives and pins below
 * it, and so on down to the sponsor. The offsets are computed from the real
 * heights (a long contents pushes everything after it further down), and each
 * one is clamped so a widget always pins fully on screen: when the column is
 * taller than the pane, a later widget slides over the tail of an earlier one
 * instead of hovering off the bottom. Sticky works here because the scroller
 * is `#app-pane` and nothing between it and these children clips overflow.
 */
const slots = useSlots()

const aside = useTemplateRef<HTMLElement>('aside')
const shell = useTemplateRef<HTMLElement>('shell')

/** One breathing space between pinned widgets, shared with the CSS below. */
const STACK_GAP = 24

let sizeWatcher: ResizeObserver | undefined
let childWatcher: MutationObserver | undefined

function stack() {
  const column = aside.value
  if (!column) {
    return
  }
  const items = Array.from(column.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  )
  // Below xl the column sits under the page and simply flows.
  if (!window.matchMedia('(min-width: 1280px)').matches) {
    for (const item of items) {
      item.style.removeProperty('--stick-top')
      item.style.removeProperty('z-index')
    }
    return
  }
  const pane = column.closest('.app__pane')
  const pagerHeight = shell.value?.querySelector<HTMLElement>('.shell__pager')?.offsetHeight ?? 0
  const room = (pane?.clientHeight ?? window.innerHeight) - pagerHeight

  const shown = items.filter((item) => {
    if (item.offsetParent === null) {
      // display: none (the contents below xl): out of the stack.
      item.style.removeProperty('--stick-top')
      return false
    }
    return true
  })

  // Two passes. Forward: where each widget would pin if there were room for
  // everything above it. Backward: the highest each may pin so that it and
  // everything after it still fit above the pager. The minimum of the two is
  // monotonic and always leaves one gap between neighbours — when the whole
  // stack is taller than the pane, the earliest widgets pin with their top
  // above the fold (a long contents ends up showing its tail) rather than
  // anything covering anything.
  const ceilings: number[] = []
  let used = STACK_GAP
  for (let index = shown.length - 1; index >= 0; index--) {
    const height = shown[index]!.offsetHeight
    ceilings[index] = room - used - height
    used += height + STACK_GAP
  }

  let ideal = STACK_GAP
  shown.forEach((item, index) => {
    const top = Math.round(Math.min(ideal, ceilings[index]!))
    item.style.setProperty('--stick-top', `${top}px`)
    item.style.zIndex = String(10 + index)
    ideal = top + item.offsetHeight + STACK_GAP
  })
}

onMounted(() => {
  const column = aside.value
  if (!column) {
    return
  }
  sizeWatcher = new ResizeObserver(stack)
  sizeWatcher.observe(column)
  for (const child of Array.from(column.children)) {
    sizeWatcher.observe(child)
  }
  // Navigating lesson to lesson swaps the widgets in place.
  childWatcher = new MutationObserver(() => {
    sizeWatcher?.disconnect()
    sizeWatcher?.observe(column)
    for (const child of Array.from(column.children)) {
      sizeWatcher?.observe(child)
    }
    stack()
  })
  childWatcher.observe(column, { childList: true })
  window.addEventListener('resize', stack, { passive: true })
  stack()
})

onBeforeUnmount(() => {
  sizeWatcher?.disconnect()
  childWatcher?.disconnect()
  window.removeEventListener('resize', stack)
})

// The pager appears on lessons and not on overviews; its height is part of
// the room the stack has.
watch(() => Boolean(slots.pagination), () => nextTick(stack))
</script>

<template>
  <div
    ref="shell"
    class="shell"
    :data-pager="$slots.pagination ? '' : undefined"
  >
    <header class="shell__hero guides">
      <div class="frame">
        <div
          v-if="$slots.toolbar"
          class="mb-4"
        >
          <slot name="toolbar" />
        </div>

        <slot name="hero" />
      </div>
    </header>

    <div class="shell__body guides">
      <div class="frame swiss-grid">
        <div class="shell__main">
          <slot />
        </div>

        <aside
          v-if="$slots.aside"
          ref="aside"
          class="shell__aside"
          aria-label="About this page"
        >
          <slot name="aside" />
        </aside>
      </div>
    </div>

    <footer
      v-if="$slots.pagination"
      class="shell__pager"
    >
      <slot name="pagination" />
    </footer>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.shell__hero {
  padding-block: 2.5rem 2rem;
  border-bottom: 1px solid var(--rule-color);
}

@media (min-width: 1024px) {
  .shell__hero {
    padding-block: 4rem 2.5rem;
  }
}

.shell__body {
  flex: 1;
  padding-block: 2.5rem 4rem;
}

.shell__main {
  grid-column: 1 / -1;
  min-width: 0;
}

.shell__aside {
  --stack-gap: 1.5rem;
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 4rem;
  min-width: 0;
}

@media (min-width: 640px) and (max-width: 1279px) {
  .shell__aside {
    grid-column: 1 / span 6;
  }
}

@media (min-width: 1280px) {
  .shell__main {
    grid-column: 1 / span 8;
  }

  .shell__aside {
    grid-column: 9 / -1;
    gap: var(--stack-gap);
    margin-top: 0;
  }
}

.shell__aside > :deep(*) {
  flex-shrink: 0;
}

/* The contents only exists here on a wide screen. */
.shell__aside > :deep(.shell-toc) {
  display: none;
}

@media (min-width: 1280px) {
  .shell__aside > :deep(.shell-toc) {
    display: block;
  }

  /* The stacking widgets. `--stick-top` is set per widget by the script
     above; until it runs they all share the first offset, which is the
     replace-in-place version of the same behaviour. The background makes a
     widget that rides over another read as a card on top, not a collision. */
  .shell__aside > :deep(.shell-stick) {
    position: sticky;
    top: var(--stick-top, var(--stack-gap));
    background: var(--ui-bg);
  }
}

.shell__aside > :deep(.shell-stick--paid) {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* The lesson bar: always at the bottom of the pane, whatever the scroll. */
.shell__pager {
  position: sticky;
  bottom: 0;
  z-index: 20;
  margin-top: auto;
}
</style>
