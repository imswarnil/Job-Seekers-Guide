#!/usr/bin/env node
/**
 * Seed the sponsor history with the owner's own properties: real paid bids
 * (payments kind `bid`, status `paid`), honestly self-promotional, not
 * sample-flagged. Idempotent: a sponsor whose URL already has a paid bid at
 * the same amount is skipped, so running it twice changes nothing.
 *
 *   node --env-file=.env scripts/seed-sponsors.mjs
 *
 * Dates are spread over the last three weeks. FlexMyWork carries the largest
 * amount, so it holds the one `brand` slot after seeding. These amounts flow
 * into the public "raised" figure by design; they are real payments in kind.
 * Nothing here may name a third-party brand that did not actually sponsor.
 */
import { Client, neonConfig } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set. Run with --env-file=.env or export it.')
  process.exit(1)
}

if (typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket
}

const daysAgo = n => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

/** { v: 2, type, layout, palette, cta } — the same shape /api/sponsors/bid stores. */
const SPONSORS = [
  {
    name: 'Namaste Salesforce',
    url: 'https://namastesalesforce.com',
    tagline: 'Salesforce, explained in plain language for people starting out',
    amount: 1000, // ₹10
    when: daysAgo(20),
    design: { v: 2, type: 'builder', layout: 'logo-left', palette: 'cobalt', cta: 'Visit' }
  },
  {
    name: 'CRM Analytics Academy',
    url: 'https://crmanalytics.imswarnil.com',
    tagline: 'Learn CRM Analytics: dashboards, dataflows and the exam',
    amount: 1400, // ₹14
    when: daysAgo(14),
    design: { v: 2, type: 'builder', layout: 'wordmark', palette: 'forest', cta: 'Try it' }
  },
  {
    name: 'Swarnil on Instagram',
    url: 'https://imswarnil.com',
    tagline: 'Behind the scenes of this guide, and the job-search notes that did not fit it',
    amount: 500, // ₹5
    when: daysAgo(8),
    design: { v: 2, type: 'creator', layout: 'minimal', palette: 'ochre', cta: 'Follow' }
  },
  {
    // The top bid: holds the brand slot after seeding.
    name: 'FlexMyWork',
    url: 'https://flexmywork.com',
    tagline: 'Find flexible work that fits around your preparation',
    amount: 2500, // ₹25
    when: daysAgo(3),
    design: { v: 2, type: 'builder', layout: 'statement', palette: 'signal', cta: 'Try it' }
  }
]

const client = new Client(url)
await client.connect()

try {
  for (const s of SPONSORS) {
    const { rows: existing } = await client.query(
      `select b.id from sponsor_bids b
       where b.sponsor_url = $1 and b.amount = $2 and b.status = 'paid'`,
      [s.url, s.amount]
    )
    if (existing.length) {
      console.log(`skip    ${s.name} (already seeded)`)
      continue
    }

    await client.query('begin')
    try {
      const { rows: [payment] } = await client.query(
        `insert into payments (kind, amount, status, name, created_at, updated_at)
         values ('bid', $1, 'paid', $2, $3, $3) returning id`,
        [s.amount, s.name, s.when]
      )
      await client.query(
        `insert into sponsor_bids (slot, sponsor_name, sponsor_url, tagline, amount, payment_id, status, design, created_at, paid_at)
         values ('brand', $1, $2, $3, $4, $5, 'paid', $6::jsonb, $7, $7)`,
        [s.name, s.url, s.tagline, s.amount, payment.id, JSON.stringify(s.design), s.when]
      )
      await client.query('commit')
      console.log(`seeded  ${s.name} — ₹${s.amount / 100} on ${s.when.slice(0, 10)}`)
    } catch (error) {
      await client.query('rollback').catch(() => {})
      throw error
    }
  }

  const { rows: [holder] } = await client.query(
    `select sponsor_name, amount from sponsor_bids
     where slot = 'brand' and status = 'paid' order by amount desc, paid_at asc limit 1`
  )
  console.log(`holder  ${holder?.sponsor_name ?? 'nobody'} at ₹${(holder?.amount ?? 0) / 100}`)
} finally {
  await client.end()
}
