# The server side

The guide was a static site on GitHub Pages. It now runs on **Cloudflare
Workers**, with **Neon Postgres** for data, **Neon Auth** for sign-in and
**Dodo Payments** for money. The guide itself did not change shape: every
lesson is still prerendered at build time and served as a static file. The
Worker only runs for the API and a handful of pages.

The endpoint-by-endpoint contract is [`api-contract.md`](api-contract.md).

## How the pieces fit

```
browser ──► Cloudflare (jobseekers.imswarnil.com)
              │
              ├─ static assets (.output/public) ── every lesson, /, /stats, /stories,
              │                                    /guestbook, /sponsor, /support, /login …
              │                                    (prerendered shells; data fetched in the browser)
              │
              └─ Worker "jobseekers" (Nuxt server, nitro preset cloudflare_module)
                   ├─ /api/*            ─► Neon Postgres (HTTP driver, one fetch per query)
                   ├─ /api/auth/*       ─► Neon Auth (Better Auth API), proxied
                   ├─ /api/uploads, /api/media/* ─► R2 bucket jobseekers-uploads (binding UPLOADS)
                   ├─ /api/support/checkout, /api/sponsors/bid ─► Dodo checkout sessions
                   ├─ /api/webhooks/dodo ◄─ Dodo (signed webhooks)
                   ├─ /stories/:id, /account, /admin/* (rendered per request)
                   └─ Nuxt Content runtime queries ─► D1 database jobseekers-content (binding DB)
```

Decisions, and why:

- **Prerender everything that can be.** Lessons, the home page and every
  community page are static HTML. Community pages fetch their data in the
  browser (`server: false`), so a new story or guestbook entry appears without a
  rebuild, and a slow database never slows a lesson. Only `/stories/:id` is
  server-rendered, so a shared link arrives with its title and text.
- **Neon over HTTP** (`@neondatabase/serverless`, `neon()`): no pool to hold open
  in a Worker. Multi-statement work uses `sql.transaction([...])`, which is one
  HTTP round trip and one Postgres transaction.
- **Neon Auth through our own origin.** The browser talks to `/api/auth/*`, and
  `server/api/auth/[...path].ts` proxies it to `NEON_AUTH_BASE_URL` with
  `@neondatabase/auth/server` (the same toolkit the SDK's Next.js adapter is
  built on; see its `BUILDING-AN-ADAPTER.md`). The session cookies are
  therefore first-party (`__Secure-neon-auth.*` on this domain) and every API
  route can read them. A short-lived signed `session_data` cookie answers most
  session checks without leaving the Worker. API clients may instead send the
  Neon Auth JWT as `Authorization: Bearer`, verified against `NEON_AUTH_JWKS_URL`
  with WebCrypto (`server/utils/jwt.ts`).
- **Users.** Accounts live in Neon Auth's own `neon_auth` schema. The app keeps a
  small mirror, `profiles`, keyed by the Neon Auth user id and written the first
  time a user writes anything. Everything a user writes references `profiles`
  with `on delete cascade`, which is what makes "delete my account" complete.
- **Admins** are the emails in `ADMIN_EMAILS`. Checked on the server for every
  `/api/admin/*` call; the `admin` route middleware is only a courtesy redirect.
- **Payments.** One pay-what-you-want product for donations, one for sponsor
  bids. The amount is set per checkout session (`product_cart[].amount`, paise).
  We insert a `payments` row first and send its id to Dodo as
  `metadata.payment_ref`. Nothing is granted on the return URL: only the signed
  webhook marks a payment paid, and the thank-you page polls
  `/api/payments/:ref` until it has.
- **Webhook idempotency.** Every verified delivery is logged by `webhook-id`
  (`on conflict do nothing`), and each update is written so that applying it
  twice equals applying it once (`paid` is terminal except for a refund; a bid's
  `paid_at` keeps its first value). The log and the updates commit in one
  transaction; the handler answers 2xx only after the commit, so a failure is
  retried by Dodo.
- **Analytics** are first-party only: a random `jsg_sid` cookie, the path, the
  referring host and Cloudflare's `cf-ipcountry`. "Live now" is sessions seen in
  the last five minutes. `app/plugins/track.client.ts` posts on every route change.
- **Rate limits** live in Postgres (`rate_events`), so they hold across isolates.
- **Plain text only.** Nothing users write is stored or rendered as HTML.
  Uploaded files are served with `nosniff` and a sandbox CSP.
- **Fail soft.** With no `DATABASE_URL`, public reads return zeros and empty
  lists, `/api/me` returns `{ user: null }` and every write answers 503 "not
  configured". The site builds and renders with no environment at all.

## Files

```
server/
  api/                     every endpoint in docs/api-contract.md
  utils/env.ts             reads settings from Worker bindings, then process.env
  utils/db.ts              Neon client, softRead (fail-soft reads), requireDb
  utils/auth.ts            session lookup through the Neon Auth proxy; requireUser/requireAdmin
  utils/jwt.ts             JWKS verification (EdDSA, ES256, RS256) with WebCrypto
  utils/dodo.ts            Dodo client, test mode unless DODO_ENV=live_mode, startCheckout
  utils/sponsors.ts        slots, floor prices, minimum next bid
  utils/limits.ts          rate limiter, visitor cookie, country
  utils/input.ts           zod helpers, plain-text cleaning, URL checks
db/
  schema.sql               the whole schema, for reading
  migrations/0001_init.sql applied by `pnpm db:migrate`
scripts/db-migrate.mjs     the migration runner (WebSocket client, one transaction per file)
wrangler.jsonc             the Worker: name, D1, R2, observability, vars
app/composables/useUser.ts /api/me, sign-in and sign-out
app/plugins/auth.client.ts finishes an OAuth return, then loads the user
app/plugins/track.client.ts page views
app/middleware/{auth,admin}.ts
app/pages/{login,account,stats,guestbook,leaderboard,sponsor}.vue
app/pages/stories/{index,new,[id]}.vue, app/pages/support/{index,thanks}.vue
app/pages/admin/{index,live,traffic,content,tables,payments,audit}.vue (+ content sub-pages)
app/components/{LessonComments,CommunityPage,StoryCard,GifPicker,ViewsChart,AdminShell}.vue
```

## Local development

```bash
cp .env.example .env      # then fill in what you have; nothing is required
pnpm install
pnpm db:migrate           # needs DATABASE_URL
pnpm dev                  # http://localhost:3000 (or: pnpm dev --port 3500)
```

`nuxt dev` uses the Cloudflare dev preset, which gives the server local
stand-ins for the D1 and R2 bindings (so uploads work locally, into
`.wrangler/state`). Settings come from `.env`.

To run the real Worker build locally: `pnpm preview` (build, then
`wrangler dev --port 3501`).

Neon Auth cookies are `Secure`; browsers accept them on `http://localhost`,
but `localhost` must be allowed in the Neon Auth trusted domains.

### Migrations

`pnpm db:migrate` applies every `db/migrations/NNNN_name.sql` not yet listed in
`schema_migrations`, in order, each in its own transaction. `pnpm db:status`
lists applied and pending. To change the schema, add the next numbered file
(never edit an applied one) and fold the change into `db/schema.sql` in the same
commit.

## One-time setup

### 1. Neon

Done for this project: `jobseekers` (region `aws-ap-southeast-1`).
For a fresh project:

1. Neon console → New project. Copy the **pooled** connection string into
   `DATABASE_URL`.
2. Project → **Auth** → enable Neon Auth. Copy the base URL into
   `NEON_AUTH_BASE_URL`, the JWKS URL into `NEON_AUTH_JWKS_URL`, the keys into
   `NEON_AUTH_PUB_CLIENT_KEY` and `NEON_AUTH_SECRET_SERVER_KEY`.
3. Auth → **Configuration → Domains**: add `https://jobseekers.imswarnil.com`
   and, for development, `http://localhost:3500` (and `:3000`, `:3501`).
4. Auth → **OAuth providers**: Google is on with Neon's shared development keys.
   Before launch, create your own Google OAuth client (Google Cloud console →
   APIs & Services → Credentials) with the redirect URI Neon shows on that page,
   and paste its id and secret into Neon. Email and password sign-in is also
   offered on `/login`; turn on email verification in Neon if you want it.
5. `pnpm db:migrate`.

### 2. Dodo Payments

Everything below in **test mode** first (the dashboard's mode switch).

1. **API key**: Developer → API keys → create. Put it in `MY_DODO_API_KEY`.
2. **Products**: Products → create two one-time products, currency **INR**,
   pricing **Pay what you want**:
   - "Support the Bangalore Job Seekers Guide", minimum ₹10, suggested ₹299.
     Its id (`pdt_…`) goes in `DODO_DONATION_PRODUCT_ID`.
   - "Sponsor spot on the Bangalore Job Seekers Guide", minimum ₹299.
     Its id goes in `DODO_SPONSOR_PRODUCT_ID`.
   The server always sends the exact amount, so the minimum only guards the
   product itself.
3. **Webhook**: Developer → Webhooks → add endpoint
   `https://jobseekers.imswarnil.com/api/webhooks/dodo` with the events
   `payment.succeeded`, `payment.failed`, `payment.cancelled` and
   `refund.succeeded`. Copy the signing secret into `DODO_WEBHOOK_SECRET`.
   For local testing: `dodo wh listen http://localhost:3500/api/webhooks/dodo`
   (Dodo CLI), or send an example from the endpoint's Testing tab.
4. Pay with a test card (see Dodo's testing docs), then check `/admin/payments`
   shows the payment as `paid` and, for a bid, `/leaderboard` lists it.
5. **Going live**: repeat 1 to 3 in live mode (keys, products and webhook
   secrets are separate per mode), put the live values in the Worker secrets,
   and set `DODO_ENV` to `live_mode` in `wrangler.jsonc`.

### 3. Cloudflare

Run from the repository root. `pnpm exec wrangler login` first.

```bash
# Nuxt Content's runtime database. Paste the printed id into wrangler.jsonc (d1_databases[0].database_id).
pnpm exec wrangler d1 create jobseekers-content

# Story media.
pnpm exec wrangler r2 bucket create jobseekers-uploads

# Settings. Each prompts for the value; nothing lands in a file or in shell history.
for name in DATABASE_URL NEON_AUTH_BASE_URL NEON_AUTH_JWKS_URL NEON_AUTH_SECRET_SERVER_KEY \
            ADMIN_EMAILS MY_DODO_API_KEY DODO_WEBHOOK_SECRET \
            DODO_DONATION_PRODUCT_ID DODO_SPONSOR_PRODUCT_ID; do
  pnpm exec wrangler secret put "$name"
done
pnpm exec wrangler secret put GIPHY_API_KEY   # optional

# Build and deploy (build writes .wrangler/deploy/config.json, which points
# `wrangler deploy` at .output/server/wrangler.json).
pnpm deploy
```

The Worker is then live at `https://jobseekers.<account>.workers.dev`. The site
redirects any other host to the canonical `jobseekers.imswarnil.com`
(`seo.redirectToCanonicalSiteUrl`), so to try the Worker build before the DNS
switch, use `pnpm preview` locally.

**Plan.** Server-rendered pages need more than the Workers Free plan's 10 ms of
CPU per request now and then. Workers Paid ($5 a month) lifts that to 30 s; the
prerendered pages are static assets and cost nothing either way.

**GitHub Actions.** `.github/workflows/deploy.yml` runs `check:lessons`, `lint`,
`typecheck`, `build`, then `wrangler deploy` on every push to `main`. Add two
repository secrets (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN`: Cloudflare dashboard → My Profile → API Tokens →
  Create token → "Edit Cloudflare Workers" template, plus Account → D1 → Edit
  and Account → Workers R2 Storage → Edit. Restrict it to this account and to
  the `imswarnil.com` zone.
- `CLOUDFLARE_ACCOUNT_ID`: the account id from the dashboard's right sidebar.

Worker secrets are not set by CI; they persist across deploys.

## Go live: moving the domain from GitHub Pages

1. Deploy once (above) and check `pnpm preview` locally against the real
   database.
2. Cloudflare dashboard → `imswarnil.com` → DNS: delete the `jobseekers` CNAME
   that points at `imswarnil.github.io`.
3. In `wrangler.jsonc`, uncomment the `routes` block
   (`{ "pattern": "jobseekers.imswarnil.com", "custom_domain": true }`) and run
   `pnpm deploy`. Wrangler creates the DNS record and the certificate.
4. GitHub repository → Settings → Pages: remove the custom domain and set the
   source to "None", so Pages stops claiming the name.
5. Dodo: confirm the webhook URL uses the custom domain; send a test event.
6. Neon Auth: confirm the trusted domain is `https://jobseekers.imswarnil.com`.
7. Visit `/stats`, sign in on `/login`, and check `/admin`.

`public/CNAME` is left in place: on Workers it is a harmless static file, and
removing it can wait until the Pages site is switched off.

## Things to know

- Nuxt Content fills the D1 database from the build's SQL dump on the first
  content query after a deploy, so the first client-side navigation after a
  deploy is a little slower. The build logs "switching to D1 database with
  binding DB"; that is expected.
- Deleting an account removes the profile and everything that cascades from it,
  deletes the user's files from R2, then removes the Neon Auth user (through
  Better Auth's `delete-user`, or directly in `neon_auth` if that endpoint is
  off). Payments and sponsor bids are kept as financial records, detached.
- A sponsor bid that is outbid while its buyer is still paying is still marked
  paid and counts on the leaderboard; it simply does not hold the slot.

## Neon CLI

The Neon CLI is already signed in on this machine (`npx neonctl me`). The
project is pinned in two package scripts:

```bash
pnpm neon projects list          # any neonctl command against this project
pnpm db:sql "select count(*) from stories"
pnpm db:migrate                  # apply db/migrations to DATABASE_URL
```

First time on a new machine: `npx neonctl auth` opens the browser to sign in,
then `npx neonctl connection-string --project-id green-mouse-68892907 --pooled`
prints the DATABASE_URL for `.env`.
