/**
 * Security headers on every HTML response the Worker renders.
 *
 * Two things to know before editing:
 *
 * 1. Most of the site never reaches this file. Prerendered pages are served by
 *    Cloudflare's static-asset layer before the Worker runs, so their headers
 *    come from `public/_headers` — the same list as here. Change one and
 *    change the other.
 * 2. `/api/*` is deliberately left alone. JSON never needs frame protection,
 *    `/api/webhooks/dodo` must stay exactly as Dodo expects it, and
 *    `/api/media/*` sets its own stricter headers (nosniff plus a sandbox CSP)
 *    where the uploaded file is actually served.
 *
 * The Content-Security-Policy is REPORT-ONLY, on purpose. This site loads
 * AdSense, which injects frames and scripts from a rotating set of Google
 * domains, plus YouTube embeds and GIPHY media; an enforced CSP that misses
 * one of those silently breaks revenue or a lesson. Report-only observes
 * without ever blocking. Do not promote it to `Content-Security-Policy`
 * without a reporting endpoint and a quiet report log first.
 */

/** True for the requests that render a page rather than serve data or a file. */
function isPageRequest(path: string): boolean {
  if (path.startsWith('/api/') || path.startsWith('/_') || path.startsWith('/__')) {
    return false
  }
  // A file extension means an asset (.css, .js, .txt, .xml, .ico …), which the
  // static layer usually serves anyway and which never needs frame protection.
  return !/\.[a-z0-9]+$/i.test(path)
}

const CSP_REPORT_ONLY = [
  `default-src 'self'`,
  // Nuxt inlines its state and hydration scripts; AdSense injects its own.
  `script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://ep2.adtrafficquality.google`,
  `style-src 'self' 'unsafe-inline'`,
  // Lesson media, YouTube thumbnails, GIPHY GIFs in the guestbook, sign-in
  // avatars from Google, and ad creatives.
  `img-src 'self' data: blob: https://i.ytimg.com https://*.giphy.com https://media.tenor.com https://c.tenor.com https://lh3.googleusercontent.com https://*.googlesyndication.com https://*.doubleclick.net https://ep1.adtrafficquality.google`,
  `media-src 'self' https://*.giphy.com https://media.tenor.com`,
  `font-src 'self' data:`,
  // The GIPHY API key stays on the server (/api/gifs/*), so the browser only
  // ever talks to our own origin plus the ad plumbing.
  `connect-src 'self' https://pagead2.googlesyndication.com https://*.doubleclick.net https://ep1.adtrafficquality.google https://csi.gstatic.com`,
  `frame-src https://www.youtube-nocookie.com https://www.youtube.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://ep2.adtrafficquality.google`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`
].join('; ')

export default defineEventHandler((event) => {
  const path = event.path.split('?')[0] || '/'
  if (!isPageRequest(path)) {
    return
  }

  setResponseHeaders(event, {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'DENY',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'content-security-policy-report-only': CSP_REPORT_ONLY
  })

  // HSTS only makes sense over https, and pinning it on localhost would make
  // local http development miserable if a browser ever honoured it.
  if (getRequestURL(event).protocol === 'https:') {
    setResponseHeader(event, 'strict-transport-security', 'max-age=31536000; includeSubDomains')
  }
})
