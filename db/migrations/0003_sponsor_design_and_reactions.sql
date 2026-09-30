-- 0003_sponsor_design_and_reactions: a sponsor designs their own card, and
-- readers can react to a lesson comment.

-- The card a sponsor designed on /sponsor before paying: which layout, which
-- colour from the fixed palette, and an optional call-to-action label, as
-- `{ "v": 1, "layout": "...", "palette": "...", "cta": "..." | null }`.
-- Validated against the allow-lists in server/utils/sponsorDesign.ts before it
-- is written, and again when it is read, so a row that no longer fits (or an
-- older bid with no design at all) falls back to the default card. Name, link,
-- logo and tagline stay in their own columns.
alter table sponsor_bids add column if not exists design jsonb;

-- Reactions under a lesson comment: one of each kind per person per comment.
-- Pressing the same reaction again takes it back. Both sides cascade, so a
-- deleted comment or a deleted account takes its reactions with it.
create table if not exists comment_reactions (
  comment_id  bigint not null references comments (id) on delete cascade,
  user_id     text not null references profiles (id) on delete cascade,
  kind        text not null check (kind in ('like', 'love', 'learned', 'funny', 'thanks')),
  created_at  timestamptz not null default now(),
  primary key (comment_id, user_id, kind)
);
create index if not exists comment_reactions_user_idx on comment_reactions (user_id);
