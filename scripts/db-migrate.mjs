#!/usr/bin/env node
/**
 * `pnpm db:migrate` — apply every file in db/migrations/ that has not been
 * applied yet, in filename order, each in its own transaction.
 *
 * Reads DATABASE_URL from the environment (or from .env, via Node's
 * --env-file-if-exists in package.json). Uses the Neon serverless driver over a
 * WebSocket, because a migration is several statements and the HTTP driver runs
 * one statement per request.
 *
 *   pnpm db:migrate            apply what is pending
 *   pnpm db:migrate --status   list applied and pending, change nothing
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client, neonConfig } from '@neondatabase/serverless'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'db/migrations')
const statusOnly = process.argv.includes('--status')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set. Put it in .env (see .env.example) or export it.')
  process.exit(1)
}

if (typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket
}

const client = new Client(url)
await client.connect()

try {
  await client.query(`create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`)

  const applied = new Set((await client.query('select name from schema_migrations')).rows.map(r => r.name))
  const files = (await readdir(dir)).filter(f => /^\d+_.+\.sql$/.test(f)).sort()
  const pending = files.filter(f => !applied.has(f))

  if (statusOnly) {
    for (const f of files) {
      console.log(`${applied.has(f) ? 'applied' : 'pending'}  ${f}`)
    }
    process.exit(0)
  }

  if (!pending.length) {
    console.log(`Nothing to apply. ${files.length} migration(s) already in place.`)
  }

  for (const file of pending) {
    const text = await readFile(join(dir, file), 'utf8')
    process.stdout.write(`Applying ${file} … `)
    try {
      await client.query('begin')
      await client.query(text)
      await client.query('insert into schema_migrations (name) values ($1)', [file])
      await client.query('commit')
      console.log('done')
    } catch (error) {
      await client.query('rollback').catch(() => {})
      console.log('failed')
      throw error
    }
  }
} finally {
  await client.end()
}
