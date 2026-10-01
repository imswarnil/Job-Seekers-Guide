<script setup lang="ts">
import { h, type VNode } from 'vue'

/**
 * A story's body. With a rich document (validated tiptap JSON from
 * `stories.body_rich`) it renders real Vue nodes: paragraphs, level-3
 * headings, lists, quotes, bold, italic and http(s) links. Without one it
 * falls back to the plain text, line breaks kept, exactly as stories always
 * rendered.
 *
 * Everything drawn here was rebuilt on the server against a strict
 * allow-list (server/utils/richText.ts), and this renderer is its own second
 * gate: an unknown node type renders as its text, an unknown mark is
 * ignored, and a link only survives if its href still parses as http(s).
 * No user string is ever treated as HTML.
 */
interface RichMark { type: string, attrs?: { href?: string } }
interface RichNode {
  type: string
  attrs?: { level?: number, start?: number }
  marks?: RichMark[]
  content?: RichNode[]
  text?: string
}

const props = defineProps<{
  body: string
  rich?: unknown
}>()

function httpHref(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? value : null
  } catch {
    return null
  }
}

function renderText(node: RichNode): VNode | string {
  let out: VNode | string = node.text ?? ''
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') {
      out = h('strong', [out])
    } else if (mark.type === 'italic') {
      out = h('em', [out])
    } else if (mark.type === 'link') {
      const href = httpHref(mark.attrs?.href)
      if (href) {
        out = h('a', { href, target: '_blank', rel: 'nofollow ugc noopener' }, [out])
      }
    }
  }
  return out
}

function renderNode(node: RichNode): VNode | string | null {
  if (node.type === 'text') {
    return renderText(node)
  }
  const children = (node.content ?? []).map(renderNode).filter((c): c is VNode | string => c !== null)
  switch (node.type) {
    case 'paragraph':
      return h('p', children.length ? children : undefined)
    case 'heading':
      return h('h3', children)
    case 'bulletList':
      return h('ul', children)
    case 'orderedList':
      return h('ol', node.attrs?.start && node.attrs.start !== 1 ? { start: node.attrs.start } : {}, children)
    case 'listItem':
      return h('li', children)
    case 'blockquote':
      return h('blockquote', children)
    default:
      // Not ours: keep the words, drop the wrapper.
      return children.length ? h('p', children) : null
  }
}

const doc = computed<RichNode | null>(() => {
  const r = props.rich as RichNode | null | undefined
  return r && typeof r === 'object' && r.type === 'doc' && Array.isArray(r.content) ? r : null
})

const Rendered = () => (doc.value?.content ?? []).map(renderNode)
</script>

<template>
  <div
    v-if="doc"
    class="story-body story-body--rich"
  >
    <Rendered />
  </div>
  <div
    v-else
    class="story-body story-body--plain"
  >
    {{ body }}
  </div>
</template>

<style scoped>
.story-body {
  max-width: var(--guide-measure);
  margin-top: 2rem;
  font-size: 1.125rem;
  line-height: 1.75;
  overflow-wrap: anywhere;
  color: var(--ui-text);
}

.story-body--plain {
  white-space: pre-line;
}

.story-body--rich :deep(p) {
  margin-top: 1em;
  min-height: 1em;
}

.story-body--rich :deep(h3) {
  margin-top: 1.75em;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
}

.story-body--rich :deep(ul),
.story-body--rich :deep(ol) {
  margin-top: 1em;
  padding-left: 1.5rem;
}

.story-body--rich :deep(ul) {
  list-style: square;
}

.story-body--rich :deep(ol) {
  list-style: decimal;
}

.story-body--rich :deep(li) {
  margin-top: 0.375em;
}

.story-body--rich :deep(li p) {
  margin-top: 0;
}

.story-body--rich :deep(blockquote) {
  margin-top: 1em;
  padding-left: 1rem;
  border-left: 2px solid var(--ui-primary);
  color: var(--ui-text-muted);
}

.story-body--rich :deep(a) {
  color: var(--ui-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.story-body--rich :deep(> :first-child) {
  margin-top: 0;
}
</style>
