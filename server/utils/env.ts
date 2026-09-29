import type { H3Event } from 'h3'

/**
 * Every setting the server reads, by the name it has in `.env` and in
 * `wrangler secret put`. See .env.example for where each one comes from.
 *
 * On Workers, secrets and vars arrive as bindings on the request
 * (`event.context.cloudflare.env`); under `nuxt dev` they arrive through
 * `process.env` from `.env`. Both are read, bindings first. Nothing here is ever
 * logged or returned to a client.
 */
export interface ServerEnv {
  DATABASE_URL?: string
  NEON_AUTH_BASE_URL?: string
  NEON_AUTH_JWKS_URL?: string
  NEON_AUTH_SECRET_SERVER_KEY?: string
  NEON_AUTH_COOKIE_SECRET?: string
  MY_DODO_API_KEY?: string
  DODO_WEBHOOK_SECRET?: string
  DODO_ENV?: string
  DODO_DONATION_PRODUCT_ID?: string
  DODO_SPONSOR_PRODUCT_ID?: string
  ADMIN_EMAILS?: string
  GIPHY_API_KEY?: string
  NUXT_PUBLIC_SITE_URL?: string
}

/** Cloudflare bindings this app declares in wrangler.jsonc. */
export interface R2ObjectBodyLike {
  body: ReadableStream
  size: number
  httpEtag: string
  httpMetadata?: { contentType?: string }
}

export interface R2BucketLike {
  put: (key: string, value: ArrayBuffer | ReadableStream | Uint8Array, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>
  get: (key: string) => Promise<R2ObjectBodyLike | null>
  delete: (keys: string | string[]) => Promise<void>
}

interface CloudflareContext {
  env?: Record<string, unknown> & { UPLOADS?: R2BucketLike }
  context?: { waitUntil?: (promise: Promise<unknown>) => void }
}

export function cloudflare(event: H3Event): CloudflareContext | undefined {
  return (event.context as { cloudflare?: CloudflareContext }).cloudflare
}

export function useServerEnv(event: H3Event): ServerEnv {
  const bindings = cloudflare(event)?.env ?? {}
  const read = (name: keyof ServerEnv): string | undefined => {
    const fromBinding = bindings[name]
    if (typeof fromBinding === 'string' && fromBinding.trim()) {
      return fromBinding.trim()
    }
    const fromProcess = typeof process !== 'undefined' ? process.env?.[name] : undefined
    return fromProcess?.trim() || undefined
  }
  return new Proxy({} as ServerEnv, {
    get: (_target, key: string) => read(key as keyof ServerEnv)
  })
}

/** The R2 bucket for story media, or undefined when not bound (local dev without wrangler). */
export function uploadsBucket(event: H3Event): R2BucketLike | undefined {
  return cloudflare(event)?.env?.UPLOADS
}

/** Run work after the response is sent when the platform allows it; otherwise await it. */
export async function afterResponse(event: H3Event, work: Promise<unknown>) {
  const ctx = cloudflare(event)?.context
  const guarded = work.catch(error => console.error('[background]', error instanceof Error ? error.message : error))
  if (ctx?.waitUntil) {
    // Called as a method: workerd throws "Illegal invocation" on a detached waitUntil.
    ctx.waitUntil(guarded)
  } else {
    await guarded
  }
}

/** The public origin, for Dodo return URLs and OAuth callbacks. */
export function siteUrl(event: H3Event): string {
  // Under `nuxt dev` the wrangler vars point at production; come back here instead.
  if (import.meta.dev) {
    return getRequestURL(event).origin
  }
  const configured = useServerEnv(event).NUXT_PUBLIC_SITE_URL
  if (configured) {
    return configured.replace(/\/+$/, '')
  }
  return getRequestURL(event).origin
}

/** A 503 that says which piece is missing without saying anything secret. */
export function notConfigured(what: string) {
  return createError({ statusCode: 503, statusMessage: `${what} is not configured yet` })
}
