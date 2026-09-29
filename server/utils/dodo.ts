import type { H3Event } from 'h3'
import DodoPayments from 'dodopayments'

/**
 * Dodo Payments, the merchant of record for every rupee this site takes.
 *
 * Test mode unless DODO_ENV is exactly `live_mode`: a missing or misspelt value
 * must never charge a real card. The API key is read from MY_DODO_API_KEY and
 * never leaves the server.
 *
 * Both kinds of payment use one pay-what-you-want product each, and the amount
 * is set per checkout session (`product_cart[].amount`, in paise). The browser
 * sends only a number of rupees; which product it maps to is decided here.
 */
export function dodoEnvironment(event: H3Event): 'test_mode' | 'live_mode' {
  return useServerEnv(event).DODO_ENV === 'live_mode' ? 'live_mode' : 'test_mode'
}

export function useDodo(event: H3Event) {
  const env = useServerEnv(event)
  if (!env.MY_DODO_API_KEY) {
    throw notConfigured('Payments')
  }
  return new DodoPayments({
    bearerToken: env.MY_DODO_API_KEY,
    environment: dodoEnvironment(event),
    webhookKey: env.DODO_WEBHOOK_SECRET ?? null
  })
}

export type PaymentKind = 'donation' | 'bid'

export function productFor(event: H3Event, kind: PaymentKind): string {
  const env = useServerEnv(event)
  const id = kind === 'donation' ? env.DODO_DONATION_PRODUCT_ID : env.DODO_SPONSOR_PRODUCT_ID
  if (!id) {
    throw notConfigured(kind === 'donation' ? 'The donation product' : 'The sponsor product')
  }
  return id
}

/**
 * Start a hosted checkout for a row already in `payments`. Our payment id goes
 * in metadata, which is how the webhook finds the row again.
 */
export async function startCheckout(event: H3Event, options: {
  paymentId: string
  kind: PaymentKind
  amount: number
  email?: string
  name?: string
  returnPath: string
}) {
  const dodo = useDodo(event)
  const productId = productFor(event, options.kind)
  const returnUrl = new URL(options.returnPath, `${siteUrl(event)}/`)
  returnUrl.searchParams.set('ref', options.paymentId)

  const session = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1, amount: options.amount }],
    billing_currency: 'INR',
    customer: options.email ? { email: options.email, name: options.name || options.email } : undefined,
    metadata: { payment_ref: options.paymentId, kind: options.kind },
    return_url: returnUrl.toString(),
    customization: { show_order_details: true }
  })

  if (!session.checkout_url) {
    throw createError({ statusCode: 502, statusMessage: 'The payment provider did not return a checkout link' })
  }
  return session
}

/** Pass our own HTTP errors through; turn anything from the SDK into a 502 without its detail. */
export function checkoutError(error: unknown) {
  if (isError(error)) {
    return error
  }
  const status = error && typeof error === 'object' && 'status' in error ? (error as { status?: number }).status : undefined
  console.error('[dodo] checkout failed:', status ?? 'no status', error instanceof Error ? error.name : '')
  return createError({ statusCode: 502, statusMessage: 'Could not start the payment. Try again in a minute.' })
}
