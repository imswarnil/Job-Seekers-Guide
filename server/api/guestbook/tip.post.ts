import { z } from 'zod'

const schema = z.object({
  name: optionalText(60),
  message: text(2, 500),
  gif: z.string().max(500).optional().nullable(),
  learned: optionalText(500),
  // Paise. ₹10 to ₹5,00,000, the same window as a donation.
  amount: z.number().int().min(1_000, 'the smallest tip is ₹10').max(50_000_000, 'for more than ₹5,00,000, write to me instead')
})

/**
 * Sign the guestbook with a tip attached. Signed in, like any signing.
 *
 * The note is inserted hidden, with a pending donation payment linked to it
 * (`guestbook.payment_id`), and the reader is sent to Dodo. Nothing shows
 * until the signed webhook says the payment succeeded, which flips
 * `hidden = false`; a failed or cancelled payment deletes the row instead
 * (server/api/webhooks/dodo.post.ts). Tips share the donation rate limit.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const sql = requireDb(event)
  const input = await readValid(event, schema)

  let gif: string | null = null
  if (input.gif) {
    gif = normaliseGif(input.gif)
    if (!gif) {
      throw createError({ statusCode: 400, statusMessage: 'gif: use a GIF link from GIPHY or Tenor' })
    }
  }
  await rateLimit(event, sql, `donate:${user.id}`, 10, 3600)

  const name = input.name || user.name
  const [payment] = await q<{ id: string }>(sql, `
    insert into payments (user_id, kind, amount, name, message) values ($1, 'donation', $2, $3, $4) returning id`,
  [user.id, input.amount, name, input.message])
  const paymentId = payment!.id

  await q(sql, `
    insert into guestbook (user_id, name, message, gif, learned, hidden, amount, payment_id)
    values ($1, $2, $3, $4, $5, true, $6, $7)`,
  [user.id, name, input.message, gif, input.learned ?? null, input.amount, paymentId])

  try {
    const session = await startCheckout(event, {
      paymentId,
      kind: 'donation',
      amount: input.amount,
      email: user.email,
      name,
      returnPath: '/guestbook?thanks=1'
    })
    await q(sql, 'update payments set dodo_session_id = $2, updated_at = now() where id = $1', [paymentId, session.session_id])
    return { checkoutUrl: session.checkout_url, ref: paymentId }
  } catch (error) {
    // The hidden note goes with the failed payment; nothing half-signed stays.
    await q(sql, 'delete from guestbook where payment_id = $1', [paymentId])
    await q(sql, `update payments set status = 'failed', updated_at = now() where id = $1`, [paymentId])
    throw checkoutError(error)
  }
})
