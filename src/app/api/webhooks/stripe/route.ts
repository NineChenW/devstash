import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { applySubscriptionState } from '@/lib/db/billing'
import { getStripe, isStripeConfigured } from '@/lib/stripe'

export const runtime = 'nodejs'

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing'])

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Billing is not configured on this server' },
      { status: 503 },
    )
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const body = await req.text()
  const secret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    await handleEvent(event)
  } catch (err) {
    console.error('Stripe webhook handler failed', { eventId: event.id, type: event.type, err })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') return
      const customerId = customerIdOf(session.customer)
      const subscriptionId = subscriptionIdOf(session.subscription)
      if (!customerId || !subscriptionId) return

      const stripe = getStripe()
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      await applySubscriptionState({
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        isPro: ACTIVE_STATUSES.has(sub.status),
      })
      return
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = customerIdOf(sub.customer)
      if (!customerId) return
      await applySubscriptionState({
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        isPro: ACTIVE_STATUSES.has(sub.status),
      })
      return
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = customerIdOf(sub.customer)
      if (!customerId) return
      await applySubscriptionState({
        stripeCustomerId: customerId,
        stripeSubscriptionId: null,
        isPro: false,
      })
      return
    }

    default:
      return
  }
}

function customerIdOf(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null
  return typeof customer === 'string' ? customer : customer.id
}

function subscriptionIdOf(
  subscription: string | Stripe.Subscription | null,
): string | null {
  if (!subscription) return null
  return typeof subscription === 'string' ? subscription : subscription.id
}
