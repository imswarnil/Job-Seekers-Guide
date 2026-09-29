import { z } from 'zod'

const schema = z.object({
  // Paise. ₹10 to ₹5,00,000.
  amount: z.number().int().min(1_000, 'the smallest gift is ₹10').max(50_000_000, 'for more than ₹5,00,000, write to me instead'),
  message: optionalText(280),
  name: optionalText(60)
})

/**
 * A donation of any amount. Signing in is not required: a signed-in donor is
 * linked to their account (and prefilled at checkout), anyone else is not.
 */
export default defineEventHandler(async (event) => {
  const sql = requireDb(event)
  const input = await readValid(event, schema)
  const user = await getSessionUser(event)
  await rateLimit(event, sql, `donate:${user?.id ?? clientIp(event)}`, 10, 3600)

  if (user) {
    await q(sql, `insert into profiles (id, email, name, image) values ($1, $2, $3, $4)
      on conflict (id) do update set last_seen = now()`, [user.id, user.email, user.name, user.image])
  }

  const [payment] = await q<{ id: string }>(sql, `
    insert into payments (user_id, kind, amount, name, message) values ($1, 'donation', $2, $3, $4) returning id`,
  [user?.id ?? null, input.amount, input.name ?? user?.name ?? null, input.message ?? null])
  const paymentId = payment!.id

  try {
    const session = await startCheckout(event, {
      paymentId,
      kind: 'donation',
      amount: input.amount,
      email: user?.email,
      name: input.name ?? user?.name,
      returnPath: '/support/thanks?kind=donation'
    })
    await q(sql, 'update payments set dodo_session_id = $2, updated_at = now() where id = $1', [paymentId, session.session_id])
    return { checkoutUrl: session.checkout_url, ref: paymentId }
  } catch (error) {
    await q(sql, `update payments set status = 'failed', updated_at = now() where id = $1`, [paymentId])
    throw checkoutError(error)
  }
})
