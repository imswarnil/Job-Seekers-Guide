-- 0002_admin_and_samples: an audit trail for admin writes, honest labels for
-- sample content, and a coarse device class for analytics.

-- Sample content: fictional stories, guestbook entries and comments seeded by
-- scripts/seed-samples.mjs so the community pages are not empty on day one.
-- Public reads return `sample: true` for these rows and the pages badge them;
-- public counts leave them out. /admin can remove them all in one action.
alter table stories   add column if not exists sample boolean not null default false;
alter table guestbook add column if not exists sample boolean not null default false;
alter table comments  add column if not exists sample boolean not null default false;
create index if not exists stories_sample_idx   on stories (id) where sample;
create index if not exists guestbook_sample_idx on guestbook (id) where sample;
create index if not exists comments_sample_idx  on comments (id) where sample;

-- `mobile`, `tablet` or `desktop`, derived from the user agent when a page view
-- is tracked. The user agent itself is never stored.
alter table sessions add column if not exists device text
  check (device is null or device in ('mobile', 'tablet', 'desktop'));

-- Every write made through /api/admin/*: who, what, which row, and the row
-- before and after. Append-only: nothing in the app updates or deletes it.
create table if not exists admin_audit (
  id          bigserial primary key,
  admin_email text not null,
  action      text not null,               -- update | delete | remove-samples | …
  table_name  text,
  row_id      text,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists admin_audit_created_idx on admin_audit (created_at desc);
create index if not exists admin_audit_table_idx on admin_audit (table_name, created_at desc);
