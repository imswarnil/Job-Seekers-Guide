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
| GET | `/api/stats/summary` | `{ visitors, pageViews, liveNow, countries, stories, jobsGot, guestbook, raised, sponsors }` (`raised` in paise; `pageViews` is every view, all time) |
| GET | `/api/stats/details` | *(extension)* `{ countries: [{ country, visitors }], topPages: [{ path, views }], perDay: [{ day, views }] }` |
| GET | `/api/stats/trend?days=30\|90\|365` | *(extension)* `{ range, tz, totals: { visitors, views, signups }, days: [{ day, visitors, views, signups }] }`. One entry per day, oldest first, zeros included; days are `YYYY-MM-DD` in India time (`tz: "Asia/Kolkata"`). `visitors` is distinct browsers that day; `totals.visitors` is distinct over the whole range. `signups` counts new Neon Auth accounts (falls back to `profiles` if `neon_auth` is not readable). Each day and `totals` also carry `raised`: paid payments in paise, by the day the checkout was opened. Admin and account pages are left out. Any other `days` is a 400. `Cache-Control: public, max-age=60`. |
| POST | `/api/track` | body `{ path, referrer }`; records a page view against a cookie session; country from `cf-ipcountry`. No personal data. |
| POST | `/api/jobs/got` | body `{ company?, package? }`; "Did you get a job?" counter; one per session → `{ ok, alreadyCounted, jobsGot }` |

## Sponsor spots (the outbid model)

There is one **slot**, `brand` (the list lives in `server/utils/sponsors.ts`).
It shows in two places: a band on the home page and the sticky card beside
every lesson. The retired names (`home-hero`, `home-footer`, `sidebar`,
`lesson-aside`, `lesson-footer`, `story-footer`, `gear`, `stats`) are still
accepted by `/api/sponsors/slot/:slot` and `/api/sponsors/bid` as aliases of
`brand`. The highest single paid bid holds it, with no expiry, until someone
pays more. The next bid must beat the holder by 10% and by at least ₹10; an
empty slot has a floor price.

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/sponsors/slot/:slot` | `{ slot, holder: null \| { name, url, image, tagline, amount, design }, minimumNextBid }` |
| GET | `/api/sponsors/leaderboard` | `{ items: [{ rank, name, url, image, type, total, slots: string[], since }] }` (`type` from the latest paid bid's design: `creator` \| `builder` \| `company`) |
| GET | `/api/sponsors/slots` | *(extension)* `{ items: [{ slot, label, floor, holder, minimumNextBid }] }` (`holder` as above, with `design`) |
| GET | `/api/sponsors/design` | *(extension)* the card designer's choices: `{ types: [{ id, label, description, badge, ctas: string[] }], layouts: [{ id, label, description }], palette: [{ id, label, bg, ink, contrast }], ctas: string[], limits: { name, tagline }, default }`. Top-level `ctas` is the union across types; the per-type lists are what a bid may actually use. Cached an hour. |
| POST | `/api/sponsors/bid` | body `{ slot, amount, name, url, image?, tagline?, design? }` (signed in) → `{ checkoutUrl, ref }` (Dodo) |

**The sponsor's card.** On `/sponsor` a bidder says who they are, then designs
the card before paying. `design` in a bid is `{ type, layout, palette, cta? }`,
checked strictly against the lists in `server/utils/sponsorDesign.ts` (the same
lists `GET /api/sponsors/design` returns); anything else, or any extra key, is
a 400:

- `type` (required): `creator` (a person promoting their Instagram or YouTube)
  · `builder` (an engineer or developer promoting a project) · `company` (a
  brand or company hiring or selling to job seekers). The type picks the badge
  the card wears (CREATOR / PROJECT / HIRING when a company's CTA is
  `We are hiring`, else SPONSOR) and which CTAs are legal.
- `layout`: `wordmark` · `logo-left` · `statement` · `minimal`
- `palette`: `signal` · `ink` · `cobalt` · `forest` · `violet` · `ochre`. Each is a
  fill plus the ink drawn on it, and every pair is at least 4.5:1 contrast
  (computed on the server; a pair that fails is dropped from the list).
- `cta`: null, or one of the type's own labels — creator: `Follow` ·
  `Subscribe` · `Watch`; builder: `Try it` · `Star it` · `Visit`; company:
  `We are hiring` · `Visit` · `Try it free`. A label from the wrong type is a 400.
- `name` 2–60 characters, `tagline` up to 90, `url` an http(s) link. `image` is
  an http(s) link, or an image the same user uploaded through `/api/uploads`
  (`/api/media/stories/<user>/<file>`; ownership is checked).

It is stored on the bid as `sponsor_bids.design`
(`{ v: 2, type, layout, palette, cta }`; v1 rows have no `type`). Every
`holder` the API returns carries `design` **resolved to colours**:
`{ type, layout, palette, accent, ink, cta }` (`accent`/`ink` are `#RRGGBB`).
Resolution is field by field: a bid from before designs existed gets the
default (`company`, `logo-left` in `ink`, no CTA); one from before types
existed reads as `company`; a stored CTA its type no longer offers is dropped
on its own rather than taking the whole card down. Hiding a bid
(`status: hidden` in the admin data manager) takes the card off the site.

The front end's `<SponsorSlot name="…">` draws the holder with `<SponsorCard>`
(the same component the designer previews with), marked "Sponsored", linked
with `rel="sponsored noopener"`, or a "Your ad here, from ₹X" placeholder
linking to `/sponsor`.

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
| GET | `/api/stories/:id` | one, with `body`, `bodyRich` (the validated rich document, or null on an older story), all `media`, `voted`, `mine`, `hidden` |
| POST | `/api/stories` | signed in; `{ title, from, to, company, package, body? \| bodyRich?, media: [{ kind, url }] }` → `{ id }`. `kind` is `image`, `video` (an `/api/uploads` URL) or `youtube`. `bodyRich` is a tiptap JSON document validated recursively against a strict allow-list (`server/utils/richText.ts`: paragraphs, level-3 headings, bullet and numbered lists, blockquotes, text with bold / italic / http(s) links; depth-, count- and size-capped); the stored plain `body` is derived from it. Raw HTML is never stored or rendered. |
| POST | `/api/stories/:id/vote` | signed in; one vote per user, pressing again takes it back → `{ voted, votes }` |
| POST | `/api/uploads` | signed in; the raw file as the body with its `Content-Type`; images ≤ 5 MB, video ≤ 50 MB; stored in R2 → `{ kind, url }` |
| GET | `/api/media/*` | *(extension)* serves an uploaded file from R2 |
| GET/POST | `/api/guestbook` | entries `{ id, name, image, message, gif?, learned?, amount?, createdAt }` (`amount` in paise when the note carried a paid tip); POST `{ name?, message, gif?, learned? }` signed in |
| POST | `/api/guestbook/tip` | signed in; `{ name?, message, gif?, learned?, amount }` (paise, ₹10–₹5,00,000) → `{ checkoutUrl, ref }`. Creates the guestbook row **hidden** plus a Dodo donation checkout linked to it; the webhook reveals the row on `payment.succeeded` and deletes it on failed / cancelled (a refund hides it again). The return URL is `/guestbook?thanks=1`. Shares the donation rate limit. |
| GET | `/api/gifs/search?q=` | *(extension)* `{ enabled, items: [{ id, title, preview, url }] }`; `enabled: false` without `GIPHY_API_KEY` |
| GET | `/api/gifs/trending` | *(extension)* same shape as search; GIPHY trending, rating g. `enabled: false` without `GIPHY_API_KEY` |
| GET/POST | `/api/comments?path=` | comments on a page `{ items, used, limit }`; POST `{ path, body, gif? }` signed in, auto-published, **max 5 per user per page**. `gif` is a GIPHY / Tenor link, same allow-list as the guestbook; story threads use `path: /stories/<id>` and offer the GIF, lesson pages never send one. Each item is `{ id, body, gif, createdAt, author, mine, sample, reactions: { counts: { like, love, learned, funny, thanks }, mine: kind[] } }` (`mine` on the item: the viewer wrote it; `reactions.mine`: the kinds the viewer has pressed) |
| POST | `/api/comments/:id/react` | signed in; body `{ kind, on? }` with `kind` one of `like` 👍 · `love` ❤️ · `learned` 💡 · `funny` 😂 · `thanks` 🙏. `on: true` adds, `false` removes, omitted toggles; one of each kind per user per comment → `{ counts, mine }` after the change. 404 for a missing comment |
| GET | `/api/account` | *(extension)* the signed-in user's stories, comments and guestbook entries |
| DELETE | `/api/account?confirm=DELETE` | deletes the user and everything they wrote (query, not body: DELETE bodies do not reach h3 on Workers) |

Plain text only, everywhere: the server strips control characters and the
pages render every field escaped.

**Sample content.** Stories, guestbook entries and comments carry
`sample: boolean`. `true` marks fictional rows seeded by
`scripts/seed-samples.mjs` (owned by the profile "Sample data"); pages show a
"Sample" badge on them. `/api/stats/summary` never counts them. An admin can
remove all of them from `/admin/content`.

## Admin (`/admin`, `isAdmin` only; admins are listed in `ADMIN_EMAILS`)

`/api/admin/*`: live and ranged analytics, users, moderation, payments, a
data manager for the app's own tables (fixed allow-list, never `neon_auth`,
never SQL from the client) and the audit log. Every admin write is validated
and recorded in `admin_audit` in the same statement.

| Method | Path |
| --- | --- |
| GET | `/api/admin/live` (online now, their pages and countries, the latest 40 views, views per minute; polled every 10 s) |
| GET | `/api/admin/analytics?range=24h\|7d\|30d\|90d&tz=` (series per hour or day, totals with the previous period, top pages, referrers, countries, devices; `?days=` still accepted) |
| GET | `/api/admin/users` |
| GET | `/api/admin/stories` · PATCH `/api/admin/stories/:id` `{ status: visible\|hidden\|featured }` · DELETE `/api/admin/stories/:id` |
| GET | `/api/admin/comments` · DELETE `/api/admin/comments/:id` |
| GET | `/api/admin/guestbook` · DELETE `/api/admin/guestbook/:id` |
| GET | `/api/admin/payments` (payments, bids, totals) |
| GET | `/api/admin/tables` (now including `comment_reactions`, read-only: composite key; deleting the comment removes them) · `/api/admin/tables/:name?page=&size=&sort=&dir=&q=&f=[{col,op,value}]&format=csv` (read-only transaction) |
| PATCH | `/api/admin/tables/:name/:id` `{ column: value }` (only the columns in `TABLE_SPECS`, server/utils/admin.ts) · DELETE `/api/admin/tables/:name/:id` (stories, guestbook, comments, page_views, jobs_got) |
| GET | `/api/admin/audit?page=&size=&table=&action=` |
| GET | `/api/admin/samples` · DELETE `/api/admin/samples` (removes every `sample` row and the sample profile; audited) |

## Other routes

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/llms.txt` | The whole guide as one plain-markdown map (llms.txt convention): every track and lesson as absolute links with one-line descriptions, plus the community pages. Built from the content collection, prerendered at build time, `text/plain; charset=utf-8`, cached an hour. |

**Security headers.** Every HTML response carries `X-Content-Type-Options:
nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(),
geolocation=()`, `Strict-Transport-Security` (https only) and a
**report-only** Content-Security-Policy (AdSense, YouTube and GIPHY make an
enforced one too risky to ship blind). Worker-rendered pages get them from
`server/middleware/security.ts`; prerendered pages are served by the
static-asset layer before the Worker runs, so the same list lives in
`public/_headers`. Change one and change the other. `/api/*` is exempt on
purpose: `/api/webhooks/dodo` stays exactly as Dodo expects, and
`/api/media/*` sets its own stricter headers (nosniff plus a sandbox CSP).

## Errors and limits

Errors are h3 errors: `{ statusCode, statusMessage }`, where `statusMessage`
is written for a person. 400 invalid input, 401 signed out, 403 not an admin,
404, 429 rate limited (comments 20/hour, reactions 120/hour, guestbook 3/day, stories 3/day,
uploads 20/day, bids 10/hour, donations and guestbook tips 10/hour together, track 120/10 minutes),
503 when the database, sign-in or payments are not configured yet.
