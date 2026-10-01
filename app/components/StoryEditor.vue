<script lang="ts">
/**
 * The rich editor for a story's body: Nuxt UI's `UEditor` (tiptap under the
 * hood), cut down to exactly what the server will store. Bold, italic,
 * one heading size (level 3), bullet and numbered lists, a quote, a link.
 * No images, no mentions, no code, no pasted colours.
 *
 * The value is the tiptap JSON document (`contentType="json"`), which the
 * server validates recursively against the same allow-list
 * (server/utils/richText.ts) and stores in `stories.body_rich`, deriving the
 * plain `body` from it. Nothing here is ever HTML.
 */

/** The plain text inside a tiptap JSON document, for the length counter. */
export function richDocText(doc: unknown): string {
  const parts: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return
    }
    const n = node as { type?: string, text?: string, content?: unknown[] }
    if (n.type === 'text' && typeof n.text === 'string') {
      parts.push(n.text)
    }
    if (Array.isArray(n.content)) {
      for (const child of n.content) {
        walk(child)
      }
    }
    if (n.type === 'paragraph' || n.type === 'heading' || n.type === 'listItem') {
      parts.push('\n')
    }
  }
  walk(doc)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
</script>

<script setup lang="ts">
defineProps<{ placeholder?: string }>()

const model = defineModel<Record<string, unknown> | null>({ default: null })

/**
 * Only what the server accepts. Everything else the starter kit ships is
 * switched off, so the toolbar, the keyboard shortcuts and the validator
 * agree on what a story can contain.
 */
const starterKit = {
  heading: { levels: [3] as (3)[] },
  codeBlock: false as const,
  code: false as const,
  strike: false as const,
  underline: false as const,
  hardBreak: false as const
}

const items = [
  [
    { 'kind': 'mark' as const, 'mark': 'bold' as const, 'icon': 'i-lucide-bold', 'aria-label': 'Bold', 'tooltip': { text: 'Bold' } },
    { 'kind': 'mark' as const, 'mark': 'italic' as const, 'icon': 'i-lucide-italic', 'aria-label': 'Italic', 'tooltip': { text: 'Italic' } }
  ],
  [
    { 'kind': 'heading' as const, 'level': 3 as const, 'icon': 'i-lucide-heading', 'aria-label': 'Heading', 'tooltip': { text: 'Heading' } },
    { 'kind': 'blockquote' as const, 'icon': 'i-lucide-text-quote', 'aria-label': 'Quote', 'tooltip': { text: 'Quote' } }
  ],
  [
    { 'kind': 'bulletList' as const, 'icon': 'i-lucide-list', 'aria-label': 'Bullet list', 'tooltip': { text: 'Bullet list' } },
    { 'kind': 'orderedList' as const, 'icon': 'i-lucide-list-ordered', 'aria-label': 'Numbered list', 'tooltip': { text: 'Numbered list' } }
  ],
  [
    { 'kind': 'link' as const, 'icon': 'i-lucide-link', 'aria-label': 'Link', 'tooltip': { text: 'Link' } }
  ]
]
</script>

<template>
  <UEditor
    v-slot="{ editor }"
    :model-value="model ?? undefined"
    content-type="json"
    :starter-kit="starterKit"
    :image="false"
    :mention="false"
    :placeholder="placeholder"
    class="story-editor"
    @update:model-value="model = ($event as Record<string, unknown>)"
  >
    <UEditorToolbar
      :editor="editor"
      :items="items"
      class="story-editor__toolbar"
    />
  </UEditor>
</template>

<style scoped>
/* A ruled writing surface, not a floating panel: hairline border, square
   corners, the toolbar separated from the page by a rule. */
.story-editor {
  border: 1px solid var(--rule-color, var(--ui-border));
}

.story-editor__toolbar {
  border-bottom: 1px solid var(--rule-color, var(--ui-border));
}

.story-editor :deep([data-slot='content']) {
  min-height: 18rem;
  padding: 1rem;
  font-size: 1rem;
  line-height: 1.7;
}

.story-editor :deep([data-slot='content'] h3) {
  margin-top: 1.25rem;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.story-editor :deep([data-slot='content'] blockquote) {
  padding-left: 0.875rem;
  border-left: 2px solid var(--ui-primary);
  color: var(--ui-text-muted);
}

.story-editor :deep([data-slot='content'] ul) {
  padding-left: 1.25rem;
  list-style: square;
}

.story-editor :deep([data-slot='content'] ol) {
  padding-left: 1.25rem;
  list-style: decimal;
}

.story-editor :deep([data-slot='content'] a) {
  color: var(--ui-primary);
  text-decoration: underline;
}

.story-editor:focus-within {
  border-color: var(--ui-text-highlighted);
}
</style>
