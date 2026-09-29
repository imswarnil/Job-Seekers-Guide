/**
 * Dodo Payments webhooks (Standard Webhooks signatures).
 *
 * 1. Verify the signature over the raw body with DODO_WEBHOOK_SECRET. Anything
 *    that fails is a 401 and changes nothing.
 * 2. Find our payment by the `payment_ref` we put in metadata at checkout.
 * 3. Apply the change in one transaction, idempotently: the delivery is logged
 *    by `webhook-id` (on conflict do nothing), and every update is written so
 *    that applying it twice is the same as applying it once. A redelivery, or
 *    two deliveries racing, cannot double-count money or flip a bid back.
 * 4. Answer 2xx only after the transaction commits, so a failure is retried.
 *
 * Events are not ordered. A late `payment.failed` after `payment.succeeded`
 * must not undo the success, so `paid` is terminal except for a refund.
 */
interface PaymentData {
  payment_id?: string
  status?: string
  total_amount?: number
  currency?: string
  metadata?: Record<string, string>
  checkout_session_id?: string | null
}

export default defineEventHandler(async (event) => {
  const env = useServerEnv(event)
  if (!env.DODO_WEBHOOK_SECRET || !env.MY_DODO_API_KEY) {
    throw notConfigured('The payment webhook')
  }
  const sql = requireDb(event)

  const raw = await readRawBody(event, 'utf8')
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  }
  const headers = {
    'webhook-id': getRequestHeader(event, 'webhook-id') || '',
    'webhook-signature': getRequestHeader(event, 'webhook-signature') || '',
    'webhook-timestamp': getRequestHeader(event, 'webhook-timestamp') || ''
  }

  let payload: { type: string, data: unknown }
  try {
    payload = useDodo(event).webhooks.unwrap(raw, { headers, key: env.DODO_WEBHOOK_SECRET }) as { type: string, data: unknown }
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const webhookId = headers['webhook-id']
  const type = payload.type
  const data = (payload.data ?? {}) as PaymentData
  const ref = data.metadata?.payment_ref
  const dodoPaymentId = data.payment_id ?? null

  const log = sql`insert into webhook_events (id, type, payload) values (${webhookId}, ${type}, ${raw}::jsonb)
    on conflict (id) do nothing`

  const validRef = Boolean(ref && /^[0-9a-f-]{36}$/i.test(ref))
  const isPayment = type.startsWith('payment.') && validRef
  // A refund carries Dodo's payment id; our metadata may not come with it.
  const isRefund = type === 'refund.succeeded' && Boolean(dodoPaymentId)

  // Events we do not act on are still logged and acknowledged.
  if (!isPayment && !isRefund) {
    await log
    return { received: true }
  }

  const statements = [log]

  if (isPayment && type === 'payment.succeeded') {
    statements.push(
      sql`update payments set status = 'paid', dodo_payment_id = coalesce(dodo_payment_id, ${dodoPaymentId}),
            updated_at = now()
          where id = ${ref}::uuid and status <> 'refunded'`,
      // A bid is marked paid with the moment it was first paid; a redelivery
      // keeps the original time, so the holder's tie-break never moves.
      sql`update sponsor_bids set status = 'paid', paid_at = coalesce(paid_at, now())
          where payment_id = ${ref}::uuid and status in ('pending', 'failed')
            and exists (select 1 from payments where id = ${ref}::uuid and status = 'paid')`
    )
  } else if (isPayment && (type === 'payment.failed' || type === 'payment.cancelled')) {
    const next = type === 'payment.failed' ? 'failed' : 'cancelled'
    statements.push(
      sql`update payments set status = ${next}, dodo_payment_id = coalesce(dodo_payment_id, ${dodoPaymentId}),
            updated_at = now()
          where id = ${ref}::uuid and status = 'pending'`,
      sql`update sponsor_bids set status = 'failed' where payment_id = ${ref}::uuid and status = 'pending'`
    )
  } else if (isRefund) {
    statements.push(
      sql`update payments set status = 'refunded', updated_at = now() where dodo_payment_id = ${dodoPaymentId}`,
      sql`update sponsor_bids set status = 'failed'
          where payment_id in (select id from payments where dodo_payment_id = ${dodoPaymentId})`
    )
  }

  await sql.transaction(statements)
  return { received: true }
})
