import { z } from 'zod'

const schema = z.object({
  slot: z.string(),
  // Paise, like every amount in the API.
  amount: z.number().int().positive().max(10_000_000_00),
  name: text(2, NAME_MAX),
  url: webUrl,
  // A logo: an http(s) link or an image this user uploaded through /api/uploads.
  image: logoUrl.optional().nullable().or(z.literal('')),
  tagline: optionalText(TAGLINE_MAX),
  // The card they designed. Optional, so an older client still works; without
  // one the bid gets the default card.
  design: designSchema.optional().nullable()
})

/**
 * A bid, with the card the sponsor designed (validated against the allow-lists
 * in server/utils/sponsorDesign.ts). Records a pending bid and a pending payment, then hands back a Dodo
 * checkout link. Nothing is shown on the site until the webhook says it was
 * paid, and the slot changes hands only if it still beats the holder then.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const sql = requireDb(event)
  const input = await readValid(event, schema)
  const slot = resolveSlot(input.slot)
  if (!slot) {
    throw createError({ statusCode: 400, statusMessage: 'slot: no such sponsor slot' })
  }
  await rateLimit(event, sql, `bid:${user.id}`, 10, 3600)

  // An uploaded logo must be this user's own image, not somebody else's file.
  const media = input.image ? MEDIA_PATH.exec(input.image) : null
  if (media) {
    const [owned] = await q(sql, `select 1 from uploads where key = $1 and user_id = $2 and kind = 'image'`, [media[1], user.id])
    if (!owned) {
      throw createError({ statusCode: 400, statusMessage: 'image: upload the logo again; that file is not one of yours' })
    }
  }

  const [holder] = await q<{ amount: number }>(sql,
    `select amount from sponsor_bids where status = 'paid' and slot = $1 order by amount desc limit 1`, [slot])
  const minimum = minimumNextBid(slot, holder ? num(holder.amount) : null)
  if (input.amount < minimum) {
    throw createError({ statusCode: 400, statusMessage: `amount: the minimum bid for this slot is ₹${(minimum / 100).toLocaleString('en-IN')}` })
  }

  const [payment] = await q<{ id: string }>(sql, `
    insert into payments (user_id, kind, amount, name) values ($1, 'bid', $2, $3) returning id`,
  [user.id, input.amount, input.name])
  const paymentId = payment!.id

  await q(sql, `
    insert into sponsor_bids (slot, user_id, sponsor_name, sponsor_url, image, tagline, amount, payment_id, design)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
  [slot, user.id, input.name, input.url, input.image || null, input.tagline ?? null, input.amount, paymentId, JSON.stringify(storedDesign(input.design))])

  try {
    const session = await startCheckout(event, {
      paymentId,
      kind: 'bid',
      amount: input.amount,
      email: user.email,
      name: user.name,
      returnPath: '/support/thanks?kind=bid'
    })
    await q(sql, 'update payments set dodo_session_id = $2, updated_at = now() where id = $1', [paymentId, session.session_id])
    return { checkoutUrl: session.checkout_url, ref: paymentId }
  } catch (error) {
    await q(sql, `update payments set status = 'failed', updated_at = now() where id = $1`, [paymentId])
    await q(sql, `update sponsor_bids set status = 'failed' where payment_id = $1`, [paymentId])
    throw checkoutError(error)
  }
})
