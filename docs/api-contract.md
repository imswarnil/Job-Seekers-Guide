# API contract

The front end and the server are built separately and meet here. Every
endpoint is JSON, under `/api`, served by the Nuxt server on Cloudflare
Workers, backed by Neon Postgres. Money is always integer **paise** (INR) in
the API and formatted on the client.

Every public read endpoint must answer fast and never throw on an empty
database: it returns zeros / empty arrays. Front-end components that call
these must render sensibly when the request fails (hide the live number, keep
the static CTA), because pages are prerendered and may be viewed offline.

## Auth (Neon Auth)

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/me` | `{ user: null, authConfigured }` or `{ user: { id, name, email, image, isAdmin }, authConfigured: true }` |
| * | `/api/auth/*` | Neon Auth's Better Auth API, proxied so the session cookies are first-party. Used by the SDK, not called by hand. |

Sign-in / sign-out UI lives at `/login` and `/account`. `useUser()`
(`app/composables/useUser.ts`, owned by the server builder) wraps `/api/me`
and exposes `user`, `ready`, `loggedIn`, `isAdmin`, `refresh()`, `whenReady()`,
`signInWith('google')`, `signInWithEmail()`, `signUpWithEmail()`, `signOut()`.
Route middleware: `definePageMeta({ middleware: 'auth' })` or `'admin'`.

A signed-in request is recognised by the Neon Auth cookies, or by
`Authorization: Bearer <Neon Auth JWT>` verified against `NEON_AUTH_JWKS_URL`.

## Stats, shown on the home hero and `/stats`

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/stats/summary` | `{ visitors, pageViews, liveNow, countries, stories, jobsGot, guestbook, raised, sponsors }` (`raised` in paise) |
| GET | `/api/stats/details` | *(extension)* `{ countries: [{ country, visitors }], topPages: [{ path, views }], perDay: [{ day, views }] }` |
| POST | `/api/track` | body `{ path, referrer }`; records a page view against a cookie session; country from `cf-ipcountry`. No personal data. |
| POST | `/api/jobs/got` | body `{ company?, package? }`; "Did you get a job?" counter; one per session → `{ ok, alreadyCounted, jobsGot }` |

## Sponsor spots (the outbid model)

A **slot** is a named place on the site (`home-hero`, `home-footer`,
`sidebar`, `lesson-aside`, `lesson-footer`, `story-footer`, `gear`, `stats`;
the list lives in `server/utils/sponsors.ts`). The highest single paid bid for
a slot holds it, with no expiry, until someone pays more. The next bid must
beat the holder by 10% and by at least ₹100; an empty slot has a floor price.

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/sponsors/slot/:slot` | `{ slot, holder: null \| { name, url, image, tagline, amount }, minimumNextBid }` |
| GET | `/api/sponsors/leaderboard` | `{ items: [{ rank, name, url, image, total, slots: string[], since }] }` |
| GET | `/api/sponsors/slots` | *(extension)* `{ items: [{ slot, label, floor, holder, minimumNextBid }] }` |
| POST | `/api/sponsors/bid` | body `{ slot, amount, name, url, image?, tagline? }` (signed in) → `{ checkoutUrl, ref }` (Dodo) |

The front end's `<SponsorSlot name="…">` shows the holder, or a
"Your ad here: from ₹X, outbid to take it" placeholder linking to
`/sponsor?slot=…`.

## Support / donations

| Method | Path | Returns |
| --- | --- | --- |
| POST | `/api/support/checkout` | body `{ amount, message?, name? }` (paise, ₹10 minimum; no sign-in needed) → `{ checkoutUrl, ref }` |
| GET | `/api/payments/:ref` | *(extension)* `{ status, kind, amount, slot }` for the thank-you page (`/support/thanks?ref=…`) |
| POST | `/api/webhooks/dodo` | Dodo webhook; marks payments paid, updates bids and totals |

## Stories, guestbook, comments

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/stories?sort=top\|new` | `{ items: [{ id, title, from, to, company, package, snippet, media: [first], votes, featured, author: { name, image }, createdAt }] }` |
| GET | `/api/stories/:id` | one, with `body`, all `media`, `voted`, `mine`, `hidden` |
| POST | `/api/stories` | signed in; `{ title, from, to, company, package, body, media: [{ kind, url }] }` → `{ id }`. `kind` is `image`, `video` (an `/api/uploads` URL) or `youtube` |
| POST | `/api/stories/:id/vote` | signed in; one vote per user, pressing again takes it back → `{ voted, votes }` |
| POST | `/api/uploads` | signed in; the raw file as the body with its `Content-Type`; images ≤ 5 MB, video ≤ 50 MB; stored in R2 → `{ kind, url }` |
| GET | `/api/media/*` | *(extension)* serves an uploaded file from R2 |
| GET/POST | `/api/guestbook` | entries `{ id, name, image, message, gif?, learned?, createdAt }`; POST `{ name?, message, gif?, learned? }` signed in |
| GET | `/api/gifs/search?q=` | *(extension)* `{ enabled, items: [{ id, title, preview, url }] }`; `enabled: false` without `GIPHY_API_KEY` |
| GET/POST | `/api/comments?path=` | lesson comments `{ items, used, limit }`; POST `{ path, body }` signed in, auto-published, **max 5 per user per page** |
| GET | `/api/account` | *(extension)* the signed-in user's stories, comments and guestbook entries |
| DELETE | `/api/account?confirm=DELETE` | deletes the user and everything they wrote (query, not body: DELETE bodies do not reach h3 on Workers) |

Plain text only, everywhere: the server strips control characters and the
pages render every field escaped.

## Admin (`/admin`, `isAdmin` only; admins are listed in `ADMIN_EMAILS`)

`/api/admin/*`: analytics (views by day, top pages, countries, referrers,
sessions), users, stories (hide/feature), comments and guestbook (delete),
sponsors and payments (read), plus a read-only SQL table browser.

| Method | Path |
| --- | --- |
| GET | `/api/admin/analytics?days=30` |
| GET | `/api/admin/users` |
| GET | `/api/admin/stories` · PATCH `/api/admin/stories/:id` `{ status: visible\|hidden\|featured }` · DELETE `/api/admin/stories/:id` |
| GET | `/api/admin/comments` · DELETE `/api/admin/comments/:id` |
| GET | `/api/admin/guestbook` · DELETE `/api/admin/guestbook/:id` |
| GET | `/api/admin/payments` (payments, bids, totals) |
| GET | `/api/admin/tables` · `/api/admin/tables/:name?page=&size=` (read-only transaction, fixed table list) |

## Errors and limits

Errors are h3 errors: `{ statusCode, statusMessage }`, where `statusMessage`
is written for a person. 400 invalid input, 401 signed out, 403 not an admin,
404, 429 rate limited (comments 20/hour, guestbook 3/day, stories 3/day,
uploads 20/day, bids 10/hour, donations 10/hour, track 120/10 minutes),
503 when the database, sign-in or payments are not configured yet.
