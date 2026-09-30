import type { H3Event } from 'h3'
import { z } from 'zod'

/**
 * The admin data manager.
 *
 * Everything here works from a fixed allow-list. A table name in a URL is
 * matched against `BROWSABLE_TABLES`; a column name in a filter or a sort is
 * matched against the columns Postgres reports for that table (and a strict
 * identifier pattern) before it is quoted into SQL; every value is a bound
 * parameter. No SQL text ever comes from the client, and nothing in
 * `neon_auth` is reachable.
 */
export const BROWSABLE_TABLES = [
  'profiles',
  'sessions',
  'page_views',
  'stories',
  'story_media',
  'story_votes',
  'uploads',
  'guestbook',
  'comments',
  'payments',
  'sponsor_bids',
  'jobs_got',
  'webhook_events',
  'rate_events',
  'admin_audit',
  'schema_migrations'
] as const

export type BrowsableTable = typeof BROWSABLE_TABLES[number]

/** One editable column: its validator, and the control the drawer shows for it. */
export interface EditField {
  schema: z.ZodType
  input: 'text' | 'textarea' | 'select' | 'switch' | 'url'
  options?: readonly string[]
  max?: number
}

const field = (schema: z.ZodType, input: EditField['input'], extra: Partial<EditField> = {}): EditField => ({ schema, input, ...extra })
const pick = <T extends readonly [string, ...string[]]>(options: T) => field(z.enum(options), 'select', { options })

/** What an admin may change in a table, and how each value is checked. */
export interface TableSpec {
  /** The single-column primary key; tables without one cannot be written to. */
  key?: string
  /** Column → how it is edited. Only these columns can be edited. */
  editable?: Record<string, EditField>
  deletable?: boolean
  /** A short line shown in the drawer, e.g. why deleting is not offered. */
  note?: string
}

export const TABLE_SPECS: Record<BrowsableTable, TableSpec> = {
  profiles: { key: 'id', note: 'Mirrored from Neon Auth on every write; accounts are deleted by their owner from /account.' },
  sessions: { key: 'id', note: 'Anonymous analytics. Read-only.' },
  page_views: { key: 'id', deletable: true },
  stories: {
    key: 'id',
    deletable: true,
    editable: {
      title: field(text(6, 120), 'text', { max: 120 }),
      status: pick(['visible', 'hidden', 'featured'] as const),
      from_place: field(text(2, 120), 'text', { max: 120 }),
      to_place: field(text(2, 120), 'text', { max: 120 }),
      company: field(optionalText(80).transform(v => v ?? null), 'text', { max: 80 }),
      package: field(optionalText(40).transform(v => v ?? null), 'text', { max: 40 })
    }
  },
  story_media: { key: 'id', note: 'Edit or delete the story instead; its files live in R2.' },
  story_votes: { note: 'Votes are counted into stories.votes. Read-only.' },
  uploads: { key: 'key', note: 'Files in R2. Read-only here.' },
  guestbook: {
    key: 'id',
    deletable: true,
    editable: {
      name: field(text(1, 60), 'text', { max: 60 }),
      message: field(text(2, 500), 'textarea', { max: 500 }),
      learned: field(optionalText(500).transform(v => v ?? null), 'textarea', { max: 500 }),
      hidden: field(z.boolean(), 'switch')
    }
  },
  comments: {
    key: 'id',
    deletable: true,
    editable: { body: field(text(1, 2000), 'textarea', { max: 2000 }) }
  },
  payments: { key: 'id', note: 'Financial records. Only the Dodo webhook changes them.' },
  sponsor_bids: {
    key: 'id',
    editable: {
      sponsor_name: field(text(2, 60), 'text', { max: 60 }),
      sponsor_url: field(webUrl, 'url', { max: 500 }),
      tagline: field(optionalText(100).transform(v => v ?? null), 'text', { max: 100 }),
      // Hiding takes a paid bid off the site; `paid` puts it back. Pending and
      // failed are the webhook's to set, never an admin's.
      status: pick(['paid', 'hidden'] as const)
    },
    note: 'Bids are kept as financial records: hide one rather than delete it.'
  },
  jobs_got: { key: 'id', deletable: true },
  webhook_events: { key: 'id', note: 'The webhook log. Read-only.' },
  rate_events: { note: 'Rate-limit bookkeeping. Read-only.' },
  admin_audit: { key: 'id', note: 'Append-only.' },
  schema_migrations: { key: 'name', note: 'Managed by pnpm db:migrate.' }
}

/** The editable columns as the drawer needs them: no validators, just the controls. */
export function editFields(spec: TableSpec) {
  return Object.entries(spec.editable ?? {}).map(([name, f]) => ({ name, input: f.input, options: f.options ?? null, max: f.max ?? null }))
}

export function browsableTable(name: string | undefined): BrowsableTable {
  const table = BROWSABLE_TABLES.find(t => t === name)
  if (!table) {
    throw createError({ statusCode: 404, statusMessage: 'No such table' })
  }
  return table
}

export type ColumnKind = 'text' | 'number' | 'date' | 'boolean' | 'json'

export interface ColumnInfo {
  name: string
  type: string
  kind: ColumnKind
  nullable: boolean
}

function kindOf(type: string): ColumnKind {
  if (/^(smallint|integer|bigint|numeric|real|double precision)$/.test(type)) {
    return 'number'
  }
  if (/^(timestamp|date)/.test(type)) {
    return 'date'
  }
  if (type === 'boolean') {
    return 'boolean'
  }
  if (/^jsonb?$/.test(type)) {
    return 'json'
  }
  return 'text'
}

/** The real columns of an allow-listed table, straight from Postgres. */
export async function tableColumns(sql: Sql, table: BrowsableTable): Promise<ColumnInfo[]> {
  const rows = await q<{ column_name: string, data_type: string, is_nullable: string }>(sql, `
    select column_name, data_type, is_nullable from information_schema.columns
    where table_schema = 'public' and table_name = $1 order by ordinal_position`, [table])
  return rows
    .filter(r => /^[a-z_][a-z0-9_]*$/.test(r.column_name))
    .map(r => ({ name: r.column_name, type: r.data_type, kind: kindOf(r.data_type), nullable: r.is_nullable === 'YES' }))
}

export const filterSchema = z.object({
  col: z.string().max(63),
  op: z.enum(['contains', 'eq', 'gte', 'lte', 'null', 'notnull']),
  value: z.string().max(200).optional().default('')
})
export type Filter = z.infer<typeof filterSchema>

/**
 * A WHERE clause from validated filters and a search term. Returns the SQL and
 * the parameters, numbered from `start`.
 */
export function buildWhere(columns: ColumnInfo[], filters: Filter[], search: string | undefined, start = 1) {
  const clauses: string[] = []
  const params: unknown[] = []
  const bind = (value: unknown) => {
    params.push(value)
    return `$${start + params.length - 1}`
  }
  const like = (value: string) => `%${value.replace(/[\\%_]/g, m => `\\${m}`)}%`

  for (const f of filters) {
    const col = columns.find(c => c.name === f.col)
    if (!col) {
      throw createError({ statusCode: 400, statusMessage: `filter: no column "${f.col.slice(0, 40)}"` })
    }
    const ident = `"${col.name}"`
    if (f.op === 'null' || f.op === 'notnull') {
      clauses.push(`${ident} is ${f.op === 'null' ? '' : 'not '}null`)
      continue
    }
    const value = f.value.trim()
    if (f.op === 'contains') {
      clauses.push(`${ident}::text ilike ${bind(like(value))}`)
    } else if (col.kind === 'number') {
      if (!/^-?\d+(\.\d+)?$/.test(value)) {
        throw createError({ statusCode: 400, statusMessage: `filter: ${col.name} needs a number` })
      }
      clauses.push(`${ident} ${f.op === 'eq' ? '=' : f.op === 'gte' ? '>=' : '<='} ${bind(value)}::numeric`)
    } else if (col.kind === 'date') {
      if (Number.isNaN(Date.parse(value))) {
        throw createError({ statusCode: 400, statusMessage: `filter: ${col.name} needs a date` })
      }
      // A bare date as an upper bound means "to the end of that day".
      const upper = f.op === 'lte' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      const op = f.op === 'eq' ? null : f.op === 'gte' ? '>=' : upper ? '<' : '<='
      if (op === null) {
        clauses.push(`${ident}::date = ${bind(value.slice(0, 10))}::date`)
      } else {
        clauses.push(`${ident} ${op} ${bind(value)}::timestamptz${upper ? ` + interval '1 day'` : ''}`)
      }
    } else if (col.kind === 'boolean') {
      if (!/^(true|false)$/.test(value)) {
        throw createError({ statusCode: 400, statusMessage: `filter: ${col.name} is true or false` })
      }
      clauses.push(`${ident} = ${bind(value === 'true')}`)
    } else if (f.op === 'eq') {
      clauses.push(`${ident}::text = ${bind(value)}`)
    } else {
      clauses.push(`${ident}::text ${f.op === 'gte' ? '>=' : '<='} ${bind(value)}`)
    }
  }

  const term = search?.trim()
  if (term) {
    const searchable = columns.filter(c => c.kind === 'text' || c.kind === 'json')
    if (searchable.length) {
      const p = bind(like(term))
      clauses.push(`(${searchable.map(c => `"${c.name}"::text ilike ${p}`).join(' or ')})`)
    }
  }
  return { where: clauses.length ? `where ${clauses.join(' and ')}` : '', params }
}

/** The ORDER BY for a validated column, or the table's natural newest-first order. */
export function buildOrder(columns: ColumnInfo[], sort: string | undefined, dir: 'asc' | 'desc') {
  const names = columns.map(c => c.name)
  const chosen = sort && names.includes(sort)
    ? sort
    : ['created_at', 'ts', 'at', 'received_at', 'last_seen', 'applied_at', 'id'].find(c => names.includes(c))
  return chosen ? `order by "${chosen}" ${dir === 'asc' ? 'asc' : 'desc'} nulls last` : ''
}

/** Parse the `f` query parameter (JSON array of filters) into validated filters. */
export function parseFilters(raw: unknown): Filter[] {
  if (typeof raw !== 'string' || !raw) {
    return []
  }
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'filter: not valid JSON' })
  }
  const parsed = z.array(filterSchema).max(12).safeParse(value)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'filter: each needs col, op and value' })
  }
  return parsed.data
}

/** A primary key from the URL, checked against the key column's type. */
export function rowKey(columns: ColumnInfo[], spec: TableSpec, raw: string | undefined): string {
  const col = columns.find(c => c.name === spec.key)
  const value = decodeURIComponent(raw || '').trim()
  if (!col || !value || value.length > 200 || (col.kind === 'number' && !/^\d+$/.test(value))) {
    throw createError({ statusCode: 404, statusMessage: 'Row not found' })
  }
  return value
}

/**
 * Update one row and write its audit entry in the same statement. The `before`
 * read and the update share one snapshot, so `before` is exactly what was
 * replaced. Returns the row after, or throws 404.
 */
export async function auditedUpdate(sql: Sql, admin: SessionUser, table: BrowsableTable, id: string, changes: Record<string, unknown>) {
  const spec = TABLE_SPECS[table]
  const cols = Object.keys(changes)
  if (!spec.key || !cols.length) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to change' })
  }
  // Column names come from the table's spec (checked by the caller), never from input.
  const sets = cols.map((c, i) => `"${c}" = $${i + 3}`).join(', ')
  const [row] = await q<{ after: Record<string, unknown> | null }>(sql, `
    with before as (select to_jsonb(t) as row from "${table}" t where "${spec.key}"::text = $1),
    upd as (update "${table}" t set ${sets} where "${spec.key}"::text = $1 returning to_jsonb(t) as row),
    log as (
      insert into admin_audit (admin_email, action, table_name, row_id, before, after)
      select $2, 'update', '${table}', $1, (select row from before), upd.row from upd
      returning id
    )
    select (select row from upd) as after, (select id from log) as audit_id`,
  [id, admin.email, ...cols.map(c => changes[c])])
  if (!row?.after) {
    throw createError({ statusCode: 404, statusMessage: 'Row not found' })
  }
  return row.after
}

/**
 * Delete one row and write its audit entry in the same statement. A story's
 * files are removed from R2 first, and its upload records after.
 */
export async function auditedDelete(event: H3Event, sql: Sql, admin: SessionUser, table: BrowsableTable, id: string) {
  const spec = TABLE_SPECS[table]
  if (!spec.key || !spec.deletable) {
    throw createError({ statusCode: 405, statusMessage: `Rows in ${table} cannot be deleted here` })
  }

  let files: string[] = []
  if (table === 'stories') {
    files = (await q<{ r2_key: string }>(sql, 'select r2_key from story_media where story_id::text = $1 and r2_key is not null', [id])).map(f => f.r2_key)
    const bucket = uploadsBucket(event)
    if (bucket && files.length) {
      await bucket.delete(files)
    }
  }

  const [row] = await q<{ before: Record<string, unknown> | null }>(sql, `
    with del as (delete from "${table}" t where "${spec.key}"::text = $1 returning to_jsonb(t) as row),
    log as (
      insert into admin_audit (admin_email, action, table_name, row_id, before)
      select $2, 'delete', '${table}', $1, del.row from del
      returning id
    )
    select (select row from del) as before, (select id from log) as audit_id`, [id, admin.email])
  if (!row?.before) {
    throw createError({ statusCode: 404, statusMessage: 'Row not found' })
  }
  if (files.length) {
    await q(sql, 'delete from uploads where key = any($1::text[])', [files])
  }
  return row.before
}

/** An audit entry for an action that is not a single-row write. */
export async function audit(sql: Sql, admin: SessionUser, action: string, details: { table?: string, rowId?: string, before?: unknown, after?: unknown } = {}) {
  await q(sql, `insert into admin_audit (admin_email, action, table_name, row_id, before, after)
    values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`, [
    admin.email,
    action,
    details.table ?? null,
    details.rowId ?? null,
    details.before === undefined ? null : JSON.stringify(details.before),
    details.after === undefined ? null : JSON.stringify(details.after)
  ])
}

/** The profile that owns every row the sample seed writes. */
export const SAMPLE_PROFILE_ID = 'sample-data'
