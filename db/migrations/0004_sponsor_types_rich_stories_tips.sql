-- 0004_sponsor_types_rich_stories_tips: three changes that ride together.
--
-- 1. Stories can carry a rich body: a validated tiptap JSON document in
--    `body_rich`, alongside the derived plain text in `body` (used for cards,
--    snippets and search). The JSON is checked against a strict allow-list in
--    server/utils/richText.ts before it is written and again before it is
--    rendered; it is never HTML. Older stories keep `body_rich` null and render
--    as plain paragraphs.
--
-- 2. A guestbook note can carry a tip. The note is inserted hidden with a
--    pending payment; the Dodo webhook reveals it (`hidden = false`) when
--    `payment.succeeded` arrives, and deletes it on failed or cancelled. The
--    `hidden` column itself has existed since 0001. `amount` is paise, shown as
--    a small badge on the note.
--
-- 3. A comment can carry a GIF, the same GIPHY / Tenor allow-list as the
--    guestbook. Lesson comments ignore it; story comments use it.
--
-- (Sponsor types live inside `sponsor_bids.design` as `{ v: 2, type, ... }`,
--  which is jsonb already; no column change needed.)

alter table stories add column if not exists body_rich jsonb;

alter table guestbook add column if not exists amount integer
  check (amount is null or amount > 0);
alter table guestbook add column if not exists payment_id uuid
  unique references payments (id) on delete cascade;

alter table comments add column if not exists gif text;
