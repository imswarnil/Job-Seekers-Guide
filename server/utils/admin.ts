/**
 * The tables the read-only browser can open. A fixed list: the table name in
 * /api/admin/tables/:name is checked against it, never interpolated from input.
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
  'schema_migrations'
] as const
