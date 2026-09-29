import type { H3Event } from 'h3'
import { z } from 'zod'

/**
 * Parse a JSON body against a zod schema; a 400 with the first problem, in
 * words a person can act on, when it does not fit.
 */
export async function readValid<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.output<T>> {
  let body: unknown
  try {
    body = await readBody(event)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'The request body is not valid JSON' })
  }
  return parseOr400(schema, body ?? {})
}

export function queryValid<T extends z.ZodType>(event: H3Event, schema: T): z.output<T> {
  return parseOr400(schema, getQuery(event))
}

function parseOr400<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value)
  if (!result.success) {
    const issue = result.error.issues[0]
    const where = issue?.path?.length ? `${issue.path.join('.')}: ` : ''
    throw createError({ statusCode: 400, statusMessage: `${where}${issue?.message || 'invalid input'}`.slice(0, 200) })
  }
  return result.data
}

/**
 * Plain text as stored: control characters removed (newlines and tabs kept),
 * runs of blank lines collapsed, trimmed. Nothing is ever stored as HTML and the
 * pages render every field escaped, so there is no markup to sanitise.
 */
export function cleanText(value: string): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** A trimmed, cleaned string with length limits. */
export const text = (min: number, max: number) =>
  z.string().transform(cleanText).pipe(z.string().min(min, `must be at least ${min} characters`).max(max, `must be at most ${max} characters`))

/** Same, but empty becomes undefined. */
export const optionalText = (max: number) =>
  z.string().optional().nullable().transform(v => (v ? cleanText(v) : '') || undefined).pipe(z.string().max(max, `must be at most ${max} characters`).optional())

/** An absolute http(s) URL, nothing else (no `javascript:`, no `data:`). */
export const webUrl = z.string().trim().max(500).refine((value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}, 'must be a full http(s) link')

/** A path on this site, as the router sees it. */
export const sitePath = z.string().trim().min(1).max(300).regex(/^\/[^\s?#]*$/, 'must be a path on this site')
