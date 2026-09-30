/**
 * The reactions a reader can leave under a lesson comment. The ids are what
 * the database stores (and its check constraint allows); the emoji and the
 * words are the front end's to draw.
 */
export const REACTION_KINDS = ['like', 'love', 'learned', 'funny', 'thanks'] as const

export type ReactionKind = typeof REACTION_KINDS[number]

export type ReactionCounts = Record<ReactionKind, number>

export function emptyCounts(): ReactionCounts {
  return { like: 0, love: 0, learned: 0, funny: 0, thanks: 0 }
}

/**
 * Counts per comment and the viewer's own reactions, for a set of comment ids,
 * in one query.
 */
export async function reactionsFor(sql: Sql, ids: number[], userId: string | null) {
  const out = new Map<number, { counts: ReactionCounts, mine: ReactionKind[] }>()
  for (const id of ids) {
    out.set(id, { counts: emptyCounts(), mine: [] })
  }
  if (!ids.length) {
    return out
  }
  const rows = await q<{ comment_id: string, kind: ReactionKind, n: string, mine: boolean }>(sql, `
    select comment_id, kind, count(*) as n, coalesce(bool_or(user_id = $2), false) as mine
    from comment_reactions where comment_id = any($1::bigint[])
    group by comment_id, kind`, [ids, userId])
  for (const r of rows) {
    const entry = out.get(Number(r.comment_id))
    if (entry && (REACTION_KINDS as readonly string[]).includes(r.kind)) {
      entry.counts[r.kind] = num(r.n)
      if (r.mine) {
        entry.mine.push(r.kind)
      }
    }
  }
  return out
}
