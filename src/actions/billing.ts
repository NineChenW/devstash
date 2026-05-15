'use server'

import { auth } from '@/auth'
import { getBillingUser, setStripeCustomerId } from '@/lib/db/billing'
import { getAppUrl, getPriceId, getStripe, isStripeConfigured } from '@/lib/stripe'

export type CreateCheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string }

export async function createCheckoutSession(
  plan: 'monthly' | 'yearly',
): Promise<CreateCheckoutResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!isStripeConfigured()) {
    return { success: false, error: 'Billing is not configured on this server' }
  }

  if (plan !== 'monthly' && plan !== 'yearly') {
    return { success: false, error: 'Invalid plan' }
  }

  const user = await getBillingUser(session.user.id)
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  if (user.isPro) {
    return { success: false, error: 'Already subscribed' }
  }

  const stripe = getStripe()
  const appUrl = getAppUrl()

  try {
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await setStripeCustomerId(user.id, customerId)
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: getPriceId(plan), quantity: 1 }],
      success_url: `${appUrl}/settings?checkout=success`,
      cancel_url: `${appUrl}/settings?checkout=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      subscription_data: { metadata: { userId: user.id } },
    })

    if (!checkout.url) {
      return { success: false, error: 'Stripe did not return a checkout URL' }
    }

    return { success: true, url: checkout.url }
  } catch (err) {
    console.error('createCheckoutSession failed', err)
    return { success: false, error: 'Failed to start checkout' }
  }
}

export type CreatePortalResult =
  | { success: true; url: string }
  | { success: false; error: string }

export async function createBillingPortalSession(): Promise<CreatePortalResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!isStripeConfigured()) {
    return { success: false, error: 'Billing is not configured on this server' }
  }

  const user = await getBillingUser(session.user.id)
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  if (!user.stripeCustomerId) {
    return { success: false, error: 'No billing account found. Subscribe first.' }
  }

  try {
    const stripe = getStripe()
    const appUrl = getAppUrl()

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    })

    return { success: true, url: portal.url }
  } catch (err) {
    console.error('createBillingPortalSession failed', err)
    return { success: false, error: 'Failed to open billing portal' }
  }
}
