import type { H3Event } from 'h3'
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

/**
 * Neon over HTTP: one fetch per query, no connection to hold open, which is the
 * shape a Worker wants. Queries are always parameterised through `sql.query`.
 */
export type Sql = NeonQueryFunction<false, false>

let cached: { url: string, sql: Sql } | undefined

/** The query function, or null when DATABASE_URL is not set. Reads use this and fail soft. */
export function useDb(event: H3Event): Sql | null {
  const url = useServerEnv(event).DATABASE_URL
  if (!url) {
    return null
  }
  if (cached?.url !== url) {
    cached = { url, sql: neon(url) }
  }
  return cached.sql
}

/** The query function for a write. Throws a 503 when there is no database. */
export function requireDb(event: H3Event): Sql {
  const sql = useDb(event)
  if (!sql) {
    throw notConfigured('The database')
  }
  return sql
}

/** Run a parameterised query and return its rows. */
export async function q<T = Record<string, unknown>>(sql: Sql, text: string, params: unknown[] = []): Promise<T[]> {
  return await sql.query(text, params) as T[]
}

/**
 * A public read that must never throw: no database, an empty database or a
 * failing one all return `fallback`, and the failure is logged without detail.
 */
export async function softRead<T>(event: H3Event, fallback: T, read: (sql: Sql) => Promise<T>): Promise<T> {
  const sql = useDb(event)
  if (!sql) {
    return fallback
  }
  try {
    return await read(sql)
  } catch (error) {
    console.error(`[db] ${event.path}:`, error instanceof Error ? error.message : 'query failed')
    return fallback
  }
}

/** Postgres `count(*)` and `sum()` arrive as strings; this turns them into numbers. */
export function num(value: unknown): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}
