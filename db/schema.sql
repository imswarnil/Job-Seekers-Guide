-- The whole schema as it stands after every migration in db/migrations/.
--
-- This file is for reading, not for running: `pnpm db:migrate` applies the
-- numbered migrations and records them in `schema_migrations`. When you add a
-- migration, fold its change into this file in the same commit.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id          text primary key,             -- neon_auth.user.id
  email       text not null,
  name        text not null default '',
  image       text,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);
create index if not exists profiles_email_idx on profiles (lower(email));

-- Anonymous analytics. `id` is a random cookie value; nothing else about the
-- visitor is stored beyond the country Cloudflare reports.
create table if not exists sessions (
  id          text primary key,
  country     text,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  views       integer not null default 0
);
create index if not exists sessions_last_seen_idx on sessions (last_seen desc);
create index if not exists sessions_country_idx on sessions (country);

create table if not exists page_views (
  id          bigserial primary key,
  session_id  text references sessions (id) on delete set null,
  path        text not null,
  referrer    text,
  country     text,
  ts          timestamptz not null default now()
);
create index if not exists page_views_ts_idx on page_views (ts desc);
create index if not exists page_views_path_idx on page_views (path);
create index if not exists page_views_session_path_idx on page_views (session_id, path, ts desc);

create table if not exists stories (
  id          bigserial primary key,
  user_id     text not null references profiles (id) on delete cascade,
  title       text not null,
  from_place  text not null,               -- where you started
  to_place    text not null,               -- where you are now
  company     text,
  package     text,                        -- as the writer puts it: "4.5 LPA"
  body        text not null,               -- plain text, rendered escaped
  status      text not null default 'visible' check (status in ('visible', 'hidden', 'featured')),
  votes       integer not null default 0,  -- denormalised count of story_votes
  created_at  timestamptz not null default now()
);
create index if not exists stories_status_votes_idx on stories (status, votes desc, created_at desc);
create index if not exists stories_status_created_idx on stories (status, created_at desc);
create index if not exists stories_user_idx on stories (user_id);

create table if not exists story_media (
  id          bigserial primary key,
  story_id    bigint not null references stories (id) on delete cascade,
  kind        text not null check (kind in ('image', 'video', 'youtube')),
  url         text not null,               -- /api/media/<key> or a YouTube URL
  r2_key      text,                        -- set when the file lives in R2
  position    integer not null default 0
);
create index if not exists story_media_story_idx on story_media (story_id, position);

-- Uploads not yet attached to a story. Lets a user only attach their own files.
create table if not exists uploads (
  key         text primary key,
  user_id     text not null references profiles (id) on delete cascade,
  kind        text not null check (kind in ('image', 'video')),
  size        integer not null,
  content_type text not null,
  created_at  timestamptz not null default now()
);
create index if not exists uploads_user_idx on uploads (user_id, created_at desc);

create table if not exists story_votes (
  story_id    bigint not null references stories (id) on delete cascade,
  user_id     text not null references profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (story_id, user_id)
);
create index if not exists story_votes_user_idx on story_votes (user_id);

create table if not exists guestbook (
  id          bigserial primary key,
  user_id     text not null references profiles (id) on delete cascade,
  name        text not null,
  message     text not null,
  gif         text,
  learned     text,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists guestbook_created_idx on guestbook (created_at desc);
create index if not exists guestbook_user_idx on guestbook (user_id, created_at desc);

create table if not exists comments (
  id          bigserial primary key,
  path        text not null,
  user_id     text not null references profiles (id) on delete cascade,
  body        text not null,
  ts          timestamptz not null default now()
);
create index if not exists comments_path_idx on comments (path, ts);
create index if not exists comments_user_path_idx on comments (user_id, path);

-- Every checkout we start. `id` is ours and travels to Dodo in metadata, so a
-- webhook can find the row without trusting anything the browser sent back.
create table if not exists payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text references profiles (id) on delete set null,
  kind                text not null check (kind in ('donation', 'bid')),
  amount              integer not null check (amount > 0),   -- paise
  currency            text not null default 'INR',
  status              text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  name                text,
  message             text,
  dodo_session_id     text unique,
  dodo_payment_id     text unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists payments_status_idx on payments (status, kind);
create index if not exists payments_user_idx on payments (user_id);

-- Every verified webhook delivery, keyed by `webhook-id`, for idempotency and audit.
create table if not exists webhook_events (
  id          text primary key,
  type        text not null,
  payload     jsonb not null,
  received_at timestamptz not null default now()
);

create table if not exists sponsor_bids (
  id          bigserial primary key,
  slot        text not null,
  user_id     text references profiles (id) on delete set null,
  sponsor_name text not null,
  sponsor_url  text not null,
  image       text,
  tagline     text,
  amount      integer not null check (amount > 0),   -- paise
  payment_id  uuid not null unique references payments (id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'hidden')),
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);
create index if not exists sponsor_bids_slot_idx on sponsor_bids (slot, status, amount desc);
create index if not exists sponsor_bids_user_idx on sponsor_bids (user_id);

create table if not exists jobs_got (
  id          bigserial primary key,
  session_id  text not null unique references sessions (id) on delete cascade,
  company     text,
  package     text,
  created_at  timestamptz not null default now()
);

-- A sliding-window rate limiter: one row per attempt, counted per key.
create table if not exists rate_events (
  key         text not null,
  at          timestamptz not null default now()
);
create index if not exists rate_events_key_at_idx on rate_events (key, at desc);
