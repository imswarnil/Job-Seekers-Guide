/**
 * The rich body of a story: a tiptap JSON document, validated recursively
 * against a strict allow-list before it is stored and rendered. Nothing a
 * user writes is ever stored or rendered as HTML; the client renders this
 * JSON to Vue nodes (app/components/StoryBody.vue), so only what this file
 * lets through can appear on a page.
 *
 * Allowed, and nothing else:
 *
 *   doc         > paragraph, heading, bulletList, orderedList, blockquote
 *   heading       level 3 only
 *   bulletList  > listItem
 *   orderedList > listItem            (attrs.start, a positive integer)
 *   listItem    > paragraph, bulletList, orderedList
 *   blockquote  > paragraph
 *   paragraph   > text
 *   text          marks: bold, italic, link (href http(s) only)
 *
 * Unknown marks and unknown attributes are dropped silently (a paste can
 * carry a stray mark; losing it is the right outcome). An unknown node type
 * is a 400: our own editor cannot produce one, so it is not ours.
 *
 * Depth, node count, text length and raw size are all capped, so a crafted
 * document cannot be deep, wide or heavy enough to hurt the renderer.
 */

const MAX_RAW_BYTES = 100_000
const MAX_NODES = 2_000
const MAX_DEPTH = 10
export const MAX_RICH_TEXT = 8_000

const BLOCK_CHILDREN: Record<string, readonly string[]> = {
  doc: ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote'],
  bulletList: ['listItem'],
  orderedList: ['listItem'],
  listItem: ['paragraph', 'bulletList', 'orderedList'],
  blockquote: ['paragraph']
}

interface RichMark { type: string, attrs?: Record<string, unknown> }
export interface RichNode {
  type: string
  attrs?: Record<string, unknown>
  marks?: RichMark[]
  content?: RichNode[]
  text?: string
}

function bad(message: string): never {
  throw createError({ statusCode: 400, statusMessage: `bodyRich: ${message}` })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function httpUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 500) {
    return null
  }
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

/** The marks kept on a text node: bold, italic, and links to http(s) only. */
function cleanMarks(raw: unknown): RichMark[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined
  }
  const out: RichMark[] = []
  for (const mark of raw) {
    if (!isRecord(mark)) {
      continue
    }
    if (mark.type === 'bold' || mark.type === 'italic') {
      if (!out.some(m => m.type === mark.type)) {
        out.push({ type: mark.type })
      }
    } else if (mark.type === 'link' && !out.some(m => m.type === 'link')) {
      const href = httpUrl(isRecord(mark.attrs) ? mark.attrs.href : null)
      if (href) {
        out.push({ type: 'link', attrs: { href } })
      }
    }
    // Any other mark (code, strike, underline, …) is dropped.
  }
  return out.length ? out : undefined
}

/**
 * Validate a rich document and return it rebuilt from scratch (only the keys
 * this file knows survive), with the plain text derived from it. Throws a 400
 * with a reason a person can act on.
 */
export function validateRichBody(raw: unknown): { doc: RichNode, text: string } {
  let size = 0
  try {
    size = JSON.stringify(raw)?.length ?? 0
  } catch {
    bad('is not valid JSON')
  }
  if (!size || size > MAX_RAW_BYTES) {
    bad(size ? 'is too large' : 'is empty')
  }
  if (!isRecord(raw) || raw.type !== 'doc' || !Array.isArray(raw.content)) {
    bad('must be a document')
  }

  let nodes = 0
  const textParts: string[] = []

  function walkText(raw: Record<string, unknown>): RichNode {
    if (typeof raw.text !== 'string' || !raw.text) {
      bad('has an empty text node')
    }
    const text = cleanText(raw.text.replace(/\n/g, ' ')) || ' '
    textParts.push(text)
    const marks = cleanMarks(raw.marks)
    return marks ? { type: 'text', text, marks } : { type: 'text', text }
  }

  function walk(node: unknown, parent: string, depth: number): RichNode | null {
    if (!isRecord(node) || typeof node.type !== 'string') {
      bad('has a malformed node')
    }
    if (depth > MAX_DEPTH) {
      bad('is nested too deeply')
    }
    if (++nodes > MAX_NODES) {
      bad('has too many blocks')
    }

    const type = node.type
    if (type === 'text') {
      if (parent !== 'paragraph' && parent !== 'heading') {
        bad('has text outside a paragraph')
      }
      return walkText(node)
    }

    const allowedHere = parent === 'doc'
      ? BLOCK_CHILDREN.doc!
      : BLOCK_CHILDREN[parent] ?? []
    if (!allowedHere.includes(type)) {
      bad(`does not allow ${JSON.stringify(type)} ${parent === 'doc' ? 'at the top level' : `inside ${parent}`}`)
    }

    const out: RichNode = { type }
    if (type === 'heading') {
      out.attrs = { level: 3 }
      if (isRecord(node.attrs) && node.attrs.level !== 3 && node.attrs.level !== undefined) {
        bad('only allows level-3 headings')
      }
    } else if (type === 'orderedList') {
      const start = isRecord(node.attrs) ? node.attrs.start : undefined
      if (typeof start === 'number' && Number.isInteger(start) && start >= 1 && start <= 1_000_000) {
        out.attrs = { start }
      }
    }

    const children = Array.isArray(node.content) ? node.content : []
    const kept: RichNode[] = []
    for (const child of children) {
      const built = walk(child, type, depth + 1)
      if (built) {
        kept.push(built)
      }
    }
    // Text lives only under paragraph / heading; everywhere else children are
    // blocks. An empty paragraph is legal (a blank line); an empty list is not.
    if (!kept.length && type !== 'paragraph' && type !== 'heading') {
      return null
    }
    if (kept.length) {
      out.content = kept
    }
    if (type === 'paragraph' || type === 'heading' || type === 'listItem' || type === 'blockquote') {
      textParts.push('\n')
    }
    return out
  }

  // Paragraph and heading may hold only text; enforce by treating them as the
  // parent key in BLOCK_CHILDREN lookups (they have no entry, so any non-text
  // child is refused by the check above).
  const content: RichNode[] = []
  for (const child of raw.content) {
    const built = walk(child, 'doc', 1)
    if (built) {
      content.push(built)
    }
  }
  if (!content.length) {
    bad('is empty')
  }

  const text = cleanText(textParts.join(' ').replace(/ ?\n ?/g, '\n').replace(/\n+/g, '\n\n'))
  if (text.length > MAX_RICH_TEXT) {
    bad(`is too long: at most ${MAX_RICH_TEXT} characters of text`)
  }

  return { doc: { type: 'doc', content }, text }
}
