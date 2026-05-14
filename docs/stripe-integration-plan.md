# Stripe Integration Plan — DevStash Pro

> A complete implementation plan for wiring Stripe Checkout + Customer Portal + Webhooks into DevStash, enforcing the Free/Pro split, and surfacing billing on `/settings`.
>
> **Date:** 2026-05-14
> **Prompt:** [context/research/stripe-integration-research.md](../context/research/stripe-integration-research.md)

---

## Table of Contents

1. [Current State (what's already there)](#1-current-state-whats-already-there)
2. [Implementation Approach](#2-implementation-approach)
3. [Stripe Dashboard Setup](#3-stripe-dashboard-setup)
4. [Files to Create](#4-files-to-create)
5. [Files to Modify](#5-files-to-modify)
6. [Feature Gating Strategy](#6-feature-gating-strategy)
7. [Session / `isPro` Propagation](#7-session--ispro-propagation)
8. [Testing Checklist](#8-testing-checklist)
9. [Implementation Order](#9-implementation-order)
10. [Open Questions / Out of Scope](#10-open-questions--out-of-scope)

---

## 1. Current State (what's already there)

### Schema — already Stripe-aware
The `User` model in [prisma/schema.prisma](../prisma/schema.prisma#L13-L32) already has every Stripe field we need; **no migration required.**

```prisma
model User {
  id                   String   @id @default(cuid())
  // ...
  isPro                Boolean  @default(false)
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  // ...
}
```

### Env vars — already documented
[.env.example](../.env.example) lines 41–45 already enumerate the five Stripe vars:

```
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_MONTHLY=""
STRIPE_PRICE_ID_YEARLY=""
```

We won't need `STRIPE_PUBLISHABLE_KEY` server-side (the spec promised it for a future client SDK; remove the unused var if we go server-redirect-only — recommended). We will also need an `APP_URL` (already present via `getAppUrl()` in [src/lib/email.ts](../src/lib/email.ts#L17-L24)) for building `success_url` / `cancel_url`.

### Auth — JWT sessions, no `update()` plumbing yet
- [src/auth.config.ts:19-30](../src/auth.config.ts#L19-L30) — JWT callback puts `user.id` on the token; session callback copies it onto `session.user.id`.
- [src/types/next-auth.d.ts](../src/types/next-auth.d.ts) — augments `Session.user` and the `JWT` to include `id`. **`isPro` is not in the session today** — we'll add it.
- Session strategy is `"jwt"` ([src/auth.ts:25](../src/auth.ts#L25)) so the workaround in the prompt (always-sync-from-DB in JWT callback) applies; database sessions are not in play.

### Pricing CTAs — all point at `/register`
[src/components/home/PricingSection.tsx:151,202](../src/components/home/PricingSection.tsx#L151-L202), [Hero.tsx](../src/components/home/Hero.tsx), [FinalCTA.tsx](../src/components/home/FinalCTA.tsx), and [HomeNav.tsx](../src/components/home/HomeNav.tsx) all `Link` to `/register`. The "Upgrade to Pro" button on the Pro card lies — it currently sends users to a free-account registration with no upsell. We'll repoint it post-launch (see [Files to Modify](#5-files-to-modify)).

### `isPro` usage in code today
`grep -rn "isPro" src` returns exactly **one** real usage — [src/components/sidebar/Sidebar.tsx:90,111](../src/components/sidebar/Sidebar.tsx#L90) where a hardcoded `PRO_TYPES = new Set(['file','image'])` set is used to render a `PRO` badge next to the `file` / `image` sidebar links. **The check is on the type name, not on `user.isPro`** — i.e. there's no enforcement anywhere, and all users currently see the badge whether they're Pro or not.

### Server action / API route patterns
- **Server actions** ([src/actions/items.ts](../src/actions/items.ts), [src/actions/collections.ts](../src/actions/collections.ts)): `'use server'` files; each action does `auth()` → check `session.user.id` → resolve `ownerId = (await getDemoUserId()) ?? session.user.id` → Zod parse → try/catch → return `{ success: true, data } | { success: false, error, fieldErrors? }`.
- **API routes** ([src/app/api/upload/route.ts](../src/app/api/upload/route.ts), [src/app/api/account/route.ts](../src/app/api/account/route.ts), [src/app/api/auth/*/route.ts](../src/app/api/auth/)): `auth()` for protected routes; `NextResponse.json({ error }, { status })` for failures; `runtime = 'nodejs'` declared where the route needs the Node runtime (uploads, bcrypt). Rate limiting via [src/lib/rate-limit.ts](../src/lib/rate-limit.ts) on every auth-touching POST.
- **Webhooks have no precedent in the codebase yet** — Stripe will be the first webhook surface. [coding-standards.md](../context/coding-standards.md) explicitly calls out webhooks as a reason to prefer API routes over server actions.

### Other patterns worth noting
- **Lazy-cached external clients** ([src/lib/email.ts:3-11](../src/lib/email.ts#L3-L11), [src/lib/r2.ts](../src/lib/r2.ts), [src/lib/rate-limit.ts:24-37](../src/lib/rate-limit.ts#L24-L37)): module-scope `let cached`/`redisClient` variable; lazy initializer reads env vars on first call, errors only if a *real* call is made without keys. We'll mirror this for the Stripe client so missing keys don't break tests.
- **Counts are already available** without any new queries — [src/lib/db/profile.ts:73-95](../src/lib/db/profile.ts#L73-L95) `getProfileStats(userId)` and per-call `prisma.item.count({ where: { userId } })` / `prisma.collection.count({ where: { userId } })`. We'll use these in the gating helpers (see [§6](#6-feature-gating-strategy)).
- **Prisma adapter** — Neon serverless via `PrismaNeon` ([src/lib/prisma.ts](../src/lib/prisma.ts)). Webhook handlers must not assume connection pooling behaviors differ; the pooled `DATABASE_URL` is fine for low-throughput Stripe events.
- **Dev override** — [src/lib/db/collections.ts:348-354](../src/lib/db/collections.ts#L348) `getDemoUserId()` returns `demo@devstash.io`'s id. Every action uses `(await getDemoUserId()) ?? session.user.id` so demo users see seeded data. **Important for billing:** we do NOT want to swap to the demo user when creating Stripe checkouts; the customer must always be the *real* signed-in user. Plan accordingly (see [§5 — server actions](#5-files-to-modify)).

---

## 2. Implementation Approach

**Stripe-hosted Checkout + Customer Portal.** No client-side Stripe.js, no embedded forms — server creates a Checkout Session URL, client redirects.

- **One product** ("DevStash Pro") with two **prices**: monthly ($8) and yearly ($72), set up in the Stripe Dashboard.
- **Checkout** is created via a server action (`createCheckoutSession`) called from `/settings`. Server returns a URL; client does `window.location.href = url`.
- **Webhook** ([src/app/api/stripe/webhook/route.ts](../src/app/api/stripe/webhook/route.ts)) is the **only** place that writes to `User.isPro` / `stripeCustomerId` / `stripeSubscriptionId`. Checkout completion, subscription updates, and cancellations all flow through it. This avoids race conditions where the client thinks Pro succeeded but the webhook hasn't fired.
- **Customer Portal** for plan switches / cancellations: another server action (`createBillingPortalSession`) builds a portal URL; the user manages everything (cancel, change plan, update card) on Stripe's hosted page.
- **`isPro` sync to session** — JWT callback queries `User.isPro` on every session validation per the prompt's workaround. One extra DB read per request; tolerable given how often `auth()` is called.
- **Feature gates** — pure helpers in [src/lib/billing/gates.ts](#) (new file). UI surfaces respect them (free users see locked CTAs); server actions enforce them (so a malicious user POSTing past the UI still hits a 403).

### Why webhooks over polling / client confirmation

Stripe Checkout returns to a `success_url` with a `session_id` query param. We could fetch the session on that page and flip `isPro`. **Why not:**
- (a) Stripe's recommended pattern is webhooks — any reconciliation logic (failed payment → revoke, subscription cancelled at period end → schedule revoke, etc.) needs webhook events anyway.
- (b) The success page is bypassable / cacheable; webhooks are signed and authoritative.
- (c) Even with webhooks, the user may land on the success page *before* the webhook fires (~1–3 sec delay). We display a "Processing your subscription…" interstitial that polls `/api/billing/status` (or just reloads in 3 sec) until `isPro` flips.

---

## 3. Stripe Dashboard Setup

Run these steps **in test mode** first (`sk_test_…` / `whsec_…`). Repeat in live mode at launch.

1. **Create product**
   - Dashboard → Products → Add product
   - Name: `DevStash Pro`
   - Description: `Unlimited items, collections, file uploads, AI features, and exports.`
   - Statement descriptor (optional): `DEVSTASH PRO`

2. **Add two prices** (under the product)
   - Monthly: $8.00 USD, recurring monthly. Copy the `price_…` id → `STRIPE_PRICE_ID_MONTHLY`.
   - Yearly: $72.00 USD, recurring yearly. Copy the `price_…` id → `STRIPE_PRICE_ID_YEARLY`.

3. **Get API keys**
   - Dashboard → Developers → API keys.
   - Reveal the test secret key → `STRIPE_SECRET_KEY`.
   - (Skip publishable key — not used server-side.)

4. **Create webhook endpoint**
   - Dashboard → Developers → Webhooks → Add endpoint.
   - Endpoint URL: `https://<your-app>.com/api/stripe/webhook` (use ngrok or `stripe listen` for local dev — see [§8 — Testing](#8-testing-checklist)).
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed` (optional — for "your card was declined" emails later)
   - Reveal signing secret → `STRIPE_WEBHOOK_SECRET`.

5. **Enable Customer Portal**
   - Dashboard → Settings → Billing → Customer Portal → Activate test link.
   - Allowed actions: update payment method, cancel subscription, switch between Monthly/Yearly prices.
   - Branding: optional logo + colors.
   - Customer information: allow update of name/email.

6. **Tax configuration** (optional, recommended pre-launch)
   - Dashboard → Settings → Tax → enable Stripe Tax if collecting in any taxable jurisdiction.
   - For checkout sessions, pass `automatic_tax: { enabled: true }` once configured.

---

## 4. Files to Create

> All paths relative to repo root. New file count: **9** (excluding `__test__` files).

### 4.1 `src/lib/stripe.ts` — lazy-cached Stripe client

```typescript
import Stripe from 'stripe'

let cached: Stripe | null = null

export function getStripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  cached = new Stripe(key, {
    apiVersion: '2025-09-30.acacia', // pin to the version we test against
    typescript: true,
  })
  return cached
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)
}

export function getPriceId(plan: 'monthly' | 'yearly'): string {
  const id = plan === 'monthly'
    ? process.env.STRIPE_PRICE_ID_MONTHLY
    : process.env.STRIPE_PRICE_ID_YEARLY
  if (!id) throw new Error(`STRIPE_PRICE_ID_${plan.toUpperCase()} is not set`)
  return id
}

export function getAppUrl(): string {
  return (process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}
```

> Follows the lazy-cache pattern from [src/lib/email.ts:3-11](../src/lib/email.ts#L3-L11) and [src/lib/r2.ts](../src/lib/r2.ts). Tests don't fail without env vars; only real calls do.

### 4.2 `src/lib/db/billing.ts` — billing-related DB queries

```typescript
import { prisma } from '@/lib/prisma'

export interface BillingUser {
  id: string
  email: string | null
  name: string | null
  isPro: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

export async function getBillingUser(userId: string): Promise<BillingUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  })
}

export async function setStripeCustomerId(userId: string, customerId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customerId },
  })
}

export async function applySubscriptionState(args: {
  stripeCustomerId: string
  stripeSubscriptionId: string | null
  isPro: boolean
}): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeCustomerId: args.stripeCustomerId },
    data: {
      isPro: args.isPro,
      stripeSubscriptionId: args.stripeSubscriptionId,
    },
  })
}
```

> `updateMany` is used in `applySubscriptionState` because `stripeCustomerId` is `@unique` but `update()` requires the primary key. `updateMany` lets us update by the unique non-id column without an extra `findUnique` round-trip.

### 4.3 `src/lib/billing/gates.ts` — pure feature-gate helpers

```typescript
import { prisma } from '@/lib/prisma'

export const FREE_ITEM_LIMIT = 50
export const FREE_COLLECTION_LIMIT = 3
export const PRO_ITEM_TYPES = new Set(['file', 'image'] as const)

export interface QuotaCheck {
  ok: boolean
  used: number
  limit: number
  error?: string
}

export async function checkItemQuota(args: {
  userId: string
  isPro: boolean
  typeName: string
}): Promise<QuotaCheck> {
  if (args.isPro) return { ok: true, used: 0, limit: Infinity }

  if (PRO_ITEM_TYPES.has(args.typeName as 'file' | 'image')) {
    return {
      ok: false,
      used: 0,
      limit: 0,
      error: `${args.typeName === 'file' ? 'File' : 'Image'} items are a Pro feature.`,
    }
  }

  const used = await prisma.item.count({ where: { userId: args.userId } })
  if (used >= FREE_ITEM_LIMIT) {
    return {
      ok: false,
      used,
      limit: FREE_ITEM_LIMIT,
      error: `You've reached the free plan's ${FREE_ITEM_LIMIT}-item limit. Upgrade to Pro for unlimited items.`,
    }
  }
  return { ok: true, used, limit: FREE_ITEM_LIMIT }
}

export async function checkCollectionQuota(args: {
  userId: string
  isPro: boolean
}): Promise<QuotaCheck> {
  if (args.isPro) return { ok: true, used: 0, limit: Infinity }

  const used = await prisma.collection.count({ where: { userId: args.userId } })
  if (used >= FREE_COLLECTION_LIMIT) {
    return {
      ok: false,
      used,
      limit: FREE_COLLECTION_LIMIT,
      error: `You've reached the free plan's ${FREE_COLLECTION_LIMIT}-collection limit. Upgrade to Pro for unlimited collections.`,
    }
  }
  return { ok: true, used, limit: FREE_COLLECTION_LIMIT }
}

export function gateForUploadKind(args: { isPro: boolean; kind: 'file' | 'image' }): {
  ok: boolean
  error?: string
} {
  if (args.isPro) return { ok: true }
  return {
    ok: false,
    error: `${args.kind === 'file' ? 'File' : 'Image'} uploads are a Pro feature.`,
  }
}
```

> **Why pure helpers, not action-internal logic:** unit-testable, and the `/settings` UI needs to show the same "5 / 50 items used" copy that the action enforces — sharing one helper avoids drift.

Test file `src/lib/billing/gates.test.ts` covers the three branches per helper (Pro bypasses, type/kind gating, count-based gating).

### 4.4 `src/actions/billing.ts` — server actions

```typescript
'use server'

import { auth } from '@/auth'
import { getStripe, getPriceId, getAppUrl, isStripeConfigured } from '@/lib/stripe'
import { getBillingUser, setStripeCustomerId } from '@/lib/db/billing'

export type CreateCheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string }

export async function createCheckoutSession(plan: 'monthly' | 'yearly'): Promise<CreateCheckoutResult> {
  if (plan !== 'monthly' && plan !== 'yearly') {
    return { success: false, error: 'Invalid plan' }
  }
  if (!isStripeConfigured()) {
    return { success: false, error: 'Billing is not configured on this server' }
  }
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return { success: false, error: 'Not authenticated' }
  }

  // NB: do NOT use getDemoUserId() here — the customer must be the real signed-in user.
  const user = await getBillingUser(session.user.id)
  if (!user) return { success: false, error: 'User not found' }
  if (user.isPro) return { success: false, error: 'Already subscribed' }

  const stripe = getStripe()
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

  const appUrl = getAppUrl()
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: getPriceId(plan), quantity: 1 }],
    success_url: `${appUrl}/settings?checkout=success`,
    cancel_url: `${appUrl}/settings?checkout=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: user.id, // belt + suspenders; we also rely on customerId
    subscription_data: {
      metadata: { userId: user.id },
    },
  })

  if (!checkout.url) return { success: false, error: 'Stripe did not return a checkout URL' }
  return { success: true, url: checkout.url }
}

export type CreatePortalResult =
  | { success: true; url: string }
  | { success: false; error: string }

export async function createBillingPortalSession(): Promise<CreatePortalResult> {
  if (!isStripeConfigured()) {
    return { success: false, error: 'Billing is not configured on this server' }
  }
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const user = await getBillingUser(session.user.id)
  if (!user?.stripeCustomerId) {
    return { success: false, error: 'No billing account found. Subscribe first.' }
  }

  const stripe = getStripe()
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${getAppUrl()}/settings`,
  })
  return { success: true, url: portal.url }
}
```

> **`getDemoUserId()` deliberately NOT used.** The demo-user shortcut exists for items/collections so seeded data shows up in dev — billing must operate on the real signed-in user or the demo would accumulate Stripe customers.

### 4.5 `src/app/api/stripe/webhook/route.ts` — webhook handler

```typescript
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { applySubscriptionState } from '@/lib/db/billing'

export const runtime = 'nodejs' // Stripe SDK requires Node, not edge

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  // 'past_due' intentionally excluded — they need to resolve payment before continuing as Pro
])

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const body = await req.text() // raw body — must NOT be parsed before constructEvent
  const secret = process.env.STRIPE_WEBHOOK_SECRET!
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('[stripe webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkout = event.data.object as Stripe.Checkout.Session
        if (checkout.mode !== 'subscription') break
        const customerId = typeof checkout.customer === 'string' ? checkout.customer : checkout.customer?.id
        const subscriptionId = typeof checkout.subscription === 'string' ? checkout.subscription : checkout.subscription?.id
        if (!customerId || !subscriptionId) break

        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        await applySubscriptionState({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          isPro: ACTIVE_STATUSES.has(sub.status),
        })
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        const isPro = event.type !== 'customer.subscription.deleted'
          && ACTIVE_STATUSES.has(sub.status)
        await applySubscriptionState({
          stripeCustomerId: customerId,
          stripeSubscriptionId: event.type === 'customer.subscription.deleted' ? null : sub.id,
          isPro,
        })
        break
      }

      default:
        // ignore other events
        break
    }
  } catch (err) {
    console.error(`[stripe webhook] handler error for ${event.type}`, err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
```

> **Why `runtime = 'nodejs'`:** the Stripe SDK uses Node crypto for signature verification; the edge runtime would fail at `constructEvent`. Same reason `/api/upload` declares `runtime = 'nodejs'`.

> **Why `req.text()` not `req.json()`:** signature verification requires the *raw* bytes. Parsing as JSON first re-serializes, which invalidates the signature.

> **Idempotency:** Stripe retries failed webhooks; the handler is naturally idempotent because `applySubscriptionState` is an unconditional `updateMany` keyed by `customerId`. If we ever add side effects (welcome email, etc.), wrap them in an `event.id`-keyed dedup check via a new `WebhookEvent` table.

### 4.6 `src/components/settings/BillingSection.tsx` — settings UI

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createBillingPortalSession, createCheckoutSession } from '@/actions/billing'

interface BillingSectionProps {
  isPro: boolean
  itemsUsed: number
  collectionsUsed: number
  itemLimit: number
  collectionLimit: number
}

export function BillingSection({
  isPro,
  itemsUsed,
  collectionsUsed,
  itemLimit,
  collectionLimit,
}: BillingSectionProps) {
  const router = useRouter()
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [pending, startTransition] = useTransition()

  const handleUpgrade = () => {
    startTransition(async () => {
      const res = await createCheckoutSession(plan)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      window.location.href = res.url
    })
  }

  const handlePortal = () => {
    startTransition(async () => {
      const res = await createBillingPortalSession()
      if (!res.success) {
        toast.error(res.error)
        return
      }
      window.location.href = res.url
    })
  }

  if (isPro) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Plan</p>
            <p className="text-xs text-muted-foreground">
              You&apos;re on DevStash Pro — unlimited everything.
            </p>
          </div>
          <Button onClick={handlePortal} disabled={pending} variant="outline">
            {pending ? 'Opening…' : 'Manage billing'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Plan: Free</p>
        <p className="text-xs text-muted-foreground">
          {itemsUsed.toLocaleString()} / {itemLimit} items · {collectionsUsed} / {collectionLimit} collections
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setPlan('monthly')}
          aria-pressed={plan === 'monthly'}
          className={plan === 'monthly' ? 'rounded-md bg-primary px-3 py-1 text-primary-foreground' : 'rounded-md px-3 py-1 text-muted-foreground'}
        >
          $8/mo
        </button>
        <button
          type="button"
          onClick={() => setPlan('yearly')}
          aria-pressed={plan === 'yearly'}
          className={plan === 'yearly' ? 'rounded-md bg-primary px-3 py-1 text-primary-foreground' : 'rounded-md px-3 py-1 text-muted-foreground'}
        >
          $72/yr <span className="text-xs">(save $24)</span>
        </button>
      </div>
      <Button onClick={handleUpgrade} disabled={pending} className="w-full">
        {pending ? 'Redirecting to Stripe…' : 'Upgrade to Pro'}
      </Button>
    </div>
  )
}
```

> The `?checkout=success` / `?checkout=cancelled` query params from `success_url` / `cancel_url` are picked up by a small `useEffect` in [src/app/settings/page.tsx](../src/app/settings/page.tsx) (or a new `BillingToast.tsx` client component) — fire a toast on either, then `router.replace('/settings')` to scrub.

### 4.7 `src/components/billing/UpgradePrompt.tsx` — in-context upsell

Used by feature-gated UIs (FileUpload, item limit hit, etc.) to nudge the user without forcing a hard navigation.

```typescript
'use client'

import { Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface UpgradePromptProps {
  feature: string
  description?: string
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center">
      <Lock className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
      <p className="text-sm font-medium">{feature} is a Pro feature</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      <Button asChild className="mt-4" size="sm">
        <Link href="/settings#billing">Upgrade to Pro</Link>
      </Button>
    </div>
  )
}
```

### 4.8 `src/lib/billing/gates.test.ts` — unit tests

Cover `checkItemQuota` (Pro bypass, type-gating for file/image, count gating at the boundary), `checkCollectionQuota` (Pro bypass, count gating at the boundary), and `gateForUploadKind` (Pro bypass, both kinds rejected for free). Per [coding-standards.md](../context/coding-standards.md), avoid mocking Prisma — these tests cover the **pure-logic branches** (Pro bypass, type-name gating); the count branches are reached only through `prisma.count()` which means they fall under "real-DB integration tests" and are out of scope. So the test file covers `gateForUploadKind` fully and the Pro/type branches of the two `check*Quota` functions.

### 4.9 `src/app/api/billing/status/route.ts` — optional status poll endpoint

For the post-checkout "Processing your subscription…" page. Returns `{ isPro: boolean }` so the client can poll until the webhook fires. **Optional** — a simpler alternative is a 3-second `setTimeout` + `router.refresh()` on the success-redirect page, which works because `getBillingUser` re-fetches from the DB. Recommend the simpler path; skip this file.

---

## 5. Files to Modify

### 5.1 [src/auth.config.ts](../src/auth.config.ts) — extend JWT callback

Per the prompt's workaround:

```diff
+ import { prisma } from "@/lib/prisma"
  // ...
  callbacks: {
-   async jwt({ token, user }) {
-     if (user) token.id = user.id
+   async jwt({ token, user }) {
+     if (user) token.id = user.id
+
+     // Always sync isPro from DB so webhook updates propagate without
+     // requiring the user to re-sign-in. ~1 DB read per session validation.
+     if (token.id) {
+       const dbUser = await prisma.user.findUnique({
+         where: { id: token.id as string },
+         select: { isPro: true },
+       })
+       token.isPro = dbUser?.isPro ?? false
+     }
      return token
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string
+       session.user.isPro = Boolean(token.isPro)
      }
      return session
    },
  },
```

> **Caveat about `auth.config.ts` and edge runtime:** the file is currently edge-safe (no Prisma import), which is why it's split from `auth.ts`. Adding `prisma` here means `auth.config.ts` is no longer edge-safe and would break if [src/proxy.ts](../src/proxy.ts) ever runs on the edge. Two options:
>
> - (a) **Recommended:** put the DB-sync logic in `auth.ts`'s `NextAuth(...)` block, not `auth.config.ts`. Currently `auth.ts` spreads `...authConfig` then overrides `providers`; we can also override `callbacks` there with a Prisma-using version. The `proxy.ts` instance uses the edge-safe `authConfig` without the DB read, which is fine — `proxy.ts` only checks `isLoggedIn`, never `isPro`.
> - (b) Set `runtime = 'nodejs'` on the proxy if we end up needing `isPro` there. Today we don't, so go with (a).
>
> Implementation: move the JWT/session callback overrides into [src/auth.ts](../src/auth.ts) just below the `providers` block. Tests guard correct behavior.

### 5.2 [src/types/next-auth.d.ts](../src/types/next-auth.d.ts) — augment `isPro`

```diff
  declare module "next-auth" {
    interface Session {
      user: {
        id: string
+       isPro: boolean
      } & DefaultSession["user"]
    }
  }

  declare module "next-auth/jwt" {
    interface JWT {
      id?: string
+     isPro?: boolean
    }
  }
```

### 5.3 [src/app/settings/page.tsx](../src/app/settings/page.tsx) — add Billing section

Insert a new `<section>` between Editor Preferences and Account. Fetch billing data server-side:

```diff
+ import { BillingSection } from '@/components/settings/BillingSection'
+ import { BillingToast } from '@/components/settings/BillingToast' // optional client toast handler
+ import { getBillingUser } from '@/lib/db/billing'
+ import { FREE_ITEM_LIMIT, FREE_COLLECTION_LIMIT } from '@/lib/billing/gates'
+ import { prisma } from '@/lib/prisma'

  export default async function SettingsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/sign-in?callbackUrl=/settings')

-   const user = await getProfileUser(session.user.id)
+   const [user, billing, itemsUsed, collectionsUsed] = await Promise.all([
+     getProfileUser(session.user.id),
+     getBillingUser(session.user.id),
+     prisma.item.count({ where: { userId: session.user.id } }),
+     prisma.collection.count({ where: { userId: session.user.id } }),
+   ])
    if (!user) redirect('/sign-in?callbackUrl=/settings')

    // ... existing logic ...

    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
+       <BillingToast />
        {/* existing header / back link */}

+       <section id="billing" className="mb-8">
+         <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
+           Billing
+         </h2>
+         <div className="rounded-xl border bg-card p-5">
+           <BillingSection
+             isPro={billing?.isPro ?? false}
+             itemsUsed={itemsUsed}
+             collectionsUsed={collectionsUsed}
+             itemLimit={FREE_ITEM_LIMIT}
+             collectionLimit={FREE_COLLECTION_LIMIT}
+           />
+         </div>
+       </section>

        {/* existing Editor Preferences + Account sections */}
      </main>
    )
  }
```

> Place Billing **above** Editor Preferences so it's the first thing users see. Cancel / upgrade are the highest-stakes settings.

### 5.4 [src/lib/db/items.ts](../src/lib/db/items.ts) — wire gating into `createItem`

```diff
+ import { checkItemQuota } from '@/lib/billing/gates'

  export async function createItem(
    userId: string,
+   isPro: boolean,
    data: CreateItemInput,
  ): Promise<ItemDetail | null> {
+   const quota = await checkItemQuota({ userId, isPro, typeName: data.typeName })
+   if (!quota.ok) {
+     // throw so the action can surface a clean error message
+     throw new QuotaExceededError(quota.error ?? 'Quota exceeded')
+   }
    const type = await prisma.itemType.findFirst({ /* ... */ })
    // ... rest unchanged
  }
```

Define `QuotaExceededError` in `src/lib/billing/gates.ts` so the action can `catch` and return `{ success: false, error: err.message }`.

### 5.5 [src/actions/items.ts](../src/actions/items.ts) — pass `isPro` to `createItem`, handle quota error

```diff
  export async function createItem(payload: CreateItemPayload): Promise<CreateItemResult> {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

    // ... existing Zod parse ...

    const ownerId = (await getDemoUserId()) ?? session.user.id
+   const isPro = session.user.isPro

    try {
-     const created = await createItemQuery(ownerId, { ... })
+     const created = await createItemQuery(ownerId, isPro, { ... })
      // ... rest unchanged
    } catch (err) {
+     if (err instanceof QuotaExceededError) {
+       return { success: false, error: err.message }
+     }
      console.error('createItem failed', err)
      return { success: false, error: 'Failed to create item' }
    }
  }
```

> **Demo-user caveat:** when `getDemoUserId()` resolves and we're operating on the demo user, the `session.user.isPro` is from the *real* signed-in user, not the demo. In dev that's fine (we want the demo user to behave like a Pro account so all features are testable per [project-overview.md](../context/project-overview.md)'s "all users have access to all features regardless of `isPro`" dev rule). For dev convenience we can short-circuit: `const isPro = ownerId === session.user.id ? session.user.isPro : true`. The simpler path is to leave the demo bypass to a feature flag (e.g. `NODE_ENV !== 'production'` → `isPro = true`).

### 5.6 [src/actions/collections.ts](../src/actions/collections.ts) — enforce collection quota

Same pattern as items: pass `isPro` to a new `createCollectionQuery` signature, call `checkCollectionQuota`, throw + catch `QuotaExceededError`.

### 5.7 [src/app/api/upload/route.ts](../src/app/api/upload/route.ts) — gate file uploads

```diff
+ import { gateForUploadKind } from '@/lib/billing/gates'
+ import { getBillingUser } from '@/lib/db/billing'

  export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!isR2Configured()) return NextResponse.json({ error: '...' }, { status: 503 })

+   const isPro = process.env.NODE_ENV !== 'production'
+     ? true
+     : Boolean(session.user.isPro)
+   const kindFromForm = ... // parse kind first
+   const gate = gateForUploadKind({ isPro, kind: kindFromForm })
+   if (!gate.ok) {
+     return NextResponse.json({ error: gate.error }, { status: 403 })
+   }

    // ... rest unchanged
  }
```

> The session-based check is cheaper than `getBillingUser` (no DB hit) since `isPro` is already on the JWT. If the JWT is stale (webhook hasn't fired yet), the user just retries — same outcome as if they refreshed.

### 5.8 [src/components/items/CreateItemDialog.tsx](../src/components/items/CreateItemDialog.tsx) — hide Pro types for free users

Today the dialog renders all 7 types in `CREATE_ITEM_TYPES`. For free users, render `file` and `image` as **disabled** with a small "Pro" badge — clicking either flips to a `<UpgradePrompt>` inline replacing the form fields. Easier: hide them entirely and add a small "Need files & images? Upgrade to Pro" footer link.

Read `session.user.isPro` via the existing session — but the dialog is a client component without a session prop today. Either:
- (a) Pass `isPro` down through `DashboardShell` → `CreateItemProvider` → `CreateItemDialog`. Cleanest.
- (b) Use `useSession()` from `next-auth/react`. Adds a `SessionProvider` we don't currently have.

**Recommended:** (a). `DashboardShell` already fetches plenty of server data; adding `isPro` is one more `getBillingUser(session.user.id)` call.

### 5.9 [src/components/sidebar/Sidebar.tsx](../src/components/sidebar/Sidebar.tsx) — gate PRO badge by `isPro`

Currently the `PRO` badge ([Sidebar.tsx:111-118](../src/components/sidebar/Sidebar.tsx#L111)) renders for all users on `file` / `image`. Two changes:
- Keep the badge visible to free users (it's the upsell signal).
- For Pro users, **hide** the badge — they're already Pro, the label is noise.

```diff
- const isPro = PRO_TYPES.has(type.name)
+ const isProType = PRO_TYPES.has(type.name)
+ const showProBadge = isProType && !userIsPro // new prop
```

> Pass `userIsPro` from `DashboardShell` like in §5.8.

### 5.10 [src/components/home/PricingSection.tsx](../src/components/home/PricingSection.tsx) — repoint Pro CTA

Today both Free and Pro CTAs link to `/register`. After launch, the Pro CTA should:
- For unauthenticated visitors: link to `/register?upgrade=pro&plan=monthly` (or `yearly`) — registration redirects to `/settings#billing` after sign-up with the plan preselected.
- For authenticated visitors: link to `/settings#billing`.

For now, **do both via a single `/register?plan=monthly`** route, and let `/register` check the session inside the page server-side and redirect logged-in users to `/settings#billing?plan=monthly`. Keep registration the only entry point so the funnel is simple.

### 5.11 [.env.example](../.env.example) — clean up + comment

Remove `STRIPE_PUBLISHABLE_KEY` (unused server-side; we're doing redirect-only Checkout). Add a comment block above the Stripe vars explaining required vs optional:

```bash
# Stripe — billing for DevStash Pro.
# All five are required for /api/stripe/webhook and the /settings billing
# section. When unset, billing actions return "not configured" errors and
# the settings page hides the upgrade UI. Existing isPro=true users are
# unaffected (the data is in the DB; gating helpers still work).
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."
```

### 5.12 (Optional) [src/proxy.ts](../src/proxy.ts) — exclude webhook from auth check

The proxy matcher today is `["/((?!api|...).*)"]` which already excludes all `/api/*` paths, so the webhook is unaffected. **No change needed** — flagged here just to confirm.

---

## 6. Feature Gating Strategy

### What's gated and where

| Feature                    | UI gate                                                   | Server gate                                              |
| -------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| 50-item limit              | Disable "New Item" button + tooltip                       | `checkItemQuota` in `createItem` query                   |
| 3-collection limit         | Disable "New Collection" button + tooltip                 | `checkCollectionQuota` in `createCollection` query       |
| File item type             | Hide / disable in `CreateItemDialog` type picker          | `checkItemQuota` rejects typeName='file' for free users  |
| Image item type            | Hide / disable in `CreateItemDialog` type picker          | Same as file                                             |
| File upload                | `<UpgradePrompt>` inline in dialog when free user picks   | `gateForUploadKind` in `/api/upload`                     |
| AI features (planned)      | Hide AI buttons entirely                                  | TBD when AI lands                                        |
| Export (planned)           | Hide export buttons                                       | TBD when export lands                                    |
| Custom item types (planned)| Disabled "Create custom type" with upsell                 | TBD when custom types land                               |

### Why dual UI + server gates

Per [coding-standards.md](../context/coding-standards.md): "Validate all inputs with Zod." Same logic applies here — the UI gate is the friendly path; the server gate is the security path. A user can `curl` past the UI; the server must still refuse.

### Dev override

In `NODE_ENV !== 'production'`, treat all users as Pro. This honors the [project-overview.md](../context/project-overview.md) dev rule and lets the demo user keep working with seeded `file` / `image` items. One place: a `isProForGating(session)` helper that returns `process.env.NODE_ENV !== 'production' ? true : Boolean(session.user.isPro)`.

### Counts come from existing queries

`getProfileStats` already does the counts ([src/lib/db/profile.ts:73-95](../src/lib/db/profile.ts#L73-L95)); the new `BillingSection` can either receive those values or call `prisma.item.count` directly. Either way the SQL load is trivial (indexed `userId`, cached in Neon's connection pool).

---

## 7. Session / `isPro` Propagation

### The flow

1. User signs in → JWT callback fires → DB read for `isPro` → token populated.
2. User clicks "Upgrade to Pro" on `/settings` → server action creates Stripe customer (if absent) + checkout session → returns URL.
3. Client redirects to Stripe → user pays → Stripe redirects to `/settings?checkout=success`.
4. Stripe fires `checkout.session.completed` webhook (1–3 sec, sometimes before redirect, sometimes after) → webhook handler flips `User.isPro = true`.
5. User lands on `/settings?checkout=success` → toast fires → page does `router.refresh()` after 3 sec → server re-renders → JWT callback fires → `isPro` syncs → settings page shows Pro state.

### Why JWT-only sync (vs DB sessions)

DevStash uses `session: { strategy: "jwt" }` ([src/auth.ts:25](../src/auth.ts#L25)). JWTs are stateless: a previously-issued token still says `isPro: false` even after the DB flips. The workaround is to **re-read the DB inside the JWT callback** — exactly what the prompt's snippet does. Tradeoff: ~one extra DB round-trip per `auth()` call (which is most authenticated server-rendered requests).

If perf ever matters: cache `isPro` in Upstash Redis keyed by `userId` with a 30-second TTL; webhook writes invalidate the key. Don't optimize this until measured — the current dashboard already does 4+ DB queries per page render and the one extra `findUnique({ select: { isPro: true }})` is in the noise.

### Why not `trigger === "update"`

Per the prompt: it doesn't reliably propagate webhook updates because `update()` is a client-side call (`useSession().update()`), and webhooks fire server-side. We'd need to poll from the client to even know to call `update()`. The always-sync pattern is simpler.

### Webhook reliability

Stripe retries failed webhook deliveries with exponential backoff for up to 3 days. The handler is idempotent (`updateMany` keyed by `stripeCustomerId`), so retries are safe. If a webhook fails permanently:
- The user will see `?checkout=success` but `isPro` stays false.
- Manual recovery: re-trigger the webhook from Stripe dashboard, or write a one-off script that calls `applySubscriptionState` from a `stripe.subscriptions.list` walk.

Long-term consideration: a daily reconciliation cron (`stripe.subscriptions.list({status: 'active'})` → upsert each customer's `isPro`) closes the loop on missed webhooks. Out of scope for v1.

---

## 8. Testing Checklist

### Unit tests (Vitest)

- [ ] `src/lib/billing/gates.test.ts`
  - `checkItemQuota`: Pro user → ok. Free user + `file` type → not ok with the correct error. Free user + `snippet` type at 49 items → ok. Free user + `snippet` at 50 items → not ok.
  - `checkCollectionQuota`: Pro user → ok. Free user at 2 collections → ok. Free user at 3 collections → not ok.
  - `gateForUploadKind`: Pro user / file → ok. Pro user / image → ok. Free user / file → not ok with correct error. Free user / image → not ok with correct error.
- [ ] Add cases to existing `src/lib/validations/items.test.ts` for the `?plan=monthly|yearly` register redirect (if implementing §5.10).

> Skip Prisma-touching count branches per [coding-standards.md](../context/coding-standards.md)'s "no Prisma mocking" rule; those become real-DB integration tests when DB testing is wired up.

### Manual / integration

- [ ] **Local webhook setup:** `stripe listen --forward-to localhost:3000/api/stripe/webhook` (writes a `whsec_…` to stdout — paste as `STRIPE_WEBHOOK_SECRET` for the local session).
- [ ] **Checkout happy path (test mode):**
  - [ ] Sign in as a non-demo user (the demo bypass would skip gating; create a fresh account).
  - [ ] `/settings#billing` → click Monthly → redirected to Stripe → use card `4242 4242 4242 4242`, any future date, any CVC.
  - [ ] Redirected back to `/settings?checkout=success` → toast appears.
  - [ ] Webhook fires within 3 sec → `User.isPro` flips to `true` → page refresh shows "Plan: Pro".
- [ ] **Quota enforcement:**
  - [ ] As a free user, create 50 items → 51st create rejected at the server (and ideally disabled in the UI).
  - [ ] As a free user, create 3 collections → 4th rejected.
  - [ ] As a free user, attempt `/api/upload` with `kind=file` via curl → 403.
- [ ] **Cancel flow:**
  - [ ] As a Pro user, "Manage billing" → portal opens → cancel subscription.
  - [ ] Wait for `customer.subscription.updated` (`cancel_at_period_end: true`) → `isPro` stays `true` (cancellation pending until period end).
  - [ ] Use Stripe dashboard's "Cancel immediately" → `customer.subscription.deleted` → `isPro` flips to `false`.
  - [ ] Free-tier UI / gates re-applied without re-sign-in.
- [ ] **Payment failure:**
  - [ ] Test card `4000 0000 0000 0341` for `invoice.payment_failed` later (out of v1).
- [ ] **Webhook signature failure:**
  - [ ] `curl -X POST .../api/stripe/webhook -d '{}'` → 400 invalid signature.
- [ ] **Stripe not configured:**
  - [ ] Unset `STRIPE_SECRET_KEY` → `/settings` renders without errors; upgrade button shows "not configured" toast on click.
- [ ] **Demo user dev override:**
  - [ ] Sign in as `demo@devstash.io` in dev → create file/image items without hitting gates → no Stripe customer created.

### Build / lint / test

- [ ] `npm run build` — clean, no new TS errors.
- [ ] `npm run lint` — no new lint errors above the existing 4 baseline.
- [ ] `npm run test:run` — pre-feature suite of 168 tests still passes, plus the new gates.test.ts cases.

---

## 9. Implementation Order

Six commits on a `feature/stripe-integration` branch, in this order — each ships a coherent slice that builds + tests clean.

1. **`chore(billing): add stripe client + gates helpers + tests`**
   - [src/lib/stripe.ts](#41-srclibstripets), [src/lib/db/billing.ts](#42-srclibdbbillingts), [src/lib/billing/gates.ts](#43-srclibbillinggatests), [src/lib/billing/gates.test.ts](#48-srclibbillinggatestestts).
   - No UI changes; no behavior changes. Pure scaffolding.

2. **`feat(auth): sync user.isPro into JWT session`**
   - Update [src/auth.ts](#51-srcauthconfigts-—-extend-jwt-callback) (move callbacks here, not auth.config.ts).
   - Update [src/types/next-auth.d.ts](#52-srctypesnext-authdts-—-augment-ispro).
   - Verify [src/proxy.ts](../src/proxy.ts) still works (no DB import on the edge).

3. **`feat(billing): create checkout + portal server actions`**
   - [src/actions/billing.ts](#44-srcactionsbillingts-—-server-actions).
   - No UI surfaces yet — just the server-callable functions. Verify with a quick repl test.

4. **`feat(billing): add stripe webhook handler`**
   - [src/app/api/stripe/webhook/route.ts](#45-srcappapistripewebhookroutets-—-webhook-handler).
   - Set up `stripe listen` locally; verify `checkout.session.completed` writes to DB.

5. **`feat(billing): wire billing UI into /settings`**
   - [src/components/settings/BillingSection.tsx](#46-srccomponentssettingsbillingsectiontsx-—-settings-ui), [src/components/settings/BillingToast.tsx](#) (optional), [src/app/settings/page.tsx](#53-srcappsettingspagetsx-—-add-billing-section).
   - End-to-end happy path testable here.

6. **`feat(billing): enforce free-tier quotas + pro-only item types`**
   - [src/lib/db/items.ts](#54-srclibdbitemsts-—-wire-gating-into-createitem), [src/actions/items.ts](#55-srcactionsitemsts-—-pass-ispro-to-createitem-handle-quota-error), [src/actions/collections.ts](#56-srcactionscollectionsts-—-enforce-collection-quota), [src/app/api/upload/route.ts](#57-srcappapiuploadroutets-—-gate-file-uploads), [src/components/items/CreateItemDialog.tsx](#58-srccomponentsitemscreateitemdialogtsx-—-hide-pro-types-for-free-users), [src/components/sidebar/Sidebar.tsx](#59-srccomponentssidebarsidebartsx-—-gate-pro-badge-by-ispro), [src/components/billing/UpgradePrompt.tsx](#47-srccomponentsbillingupgradeprompttsx-—-in-context-upsell), [src/components/home/PricingSection.tsx](#510-srccomponentshomepricingsectiontsx-—-repoint-pro-cta).
   - This is the largest commit — gates the entire app. Split into two commits if it exceeds ~500 lines.

> Skip the optional [/api/billing/status](#49-srcappapibillingstatusroutets-—-optional-status-poll-endpoint) endpoint — the 3-second-refresh-on-success approach is simpler and works.

---

## 10. Open Questions / Out of Scope

### Open questions to confirm before implementing

- **Should the demo user be treated as Pro in production?** The dev override flips all users to Pro in `NODE_ENV !== 'production'`. In prod, the demo user (`demo@devstash.io`) would be a Free user, which means seeded file/image items would render but creating new ones would fail. Two options: (a) seed `isPro=true` on the demo user in production seeds, (b) skip the gate for the demo email. **Recommendation: (a)** — simpler and avoids special-case logic.
- **Promotion codes?** `allow_promotion_codes: true` is set in the checkout config. Confirm with marketing whether to ship with promos enabled, or behind a feature flag. Easy toggle in [src/actions/billing.ts](#44-srcactionsbillingts-—-server-actions).
- **What happens to existing rows when a Pro user downgrades?** Current plan: cancellation flips `isPro: false`; existing file/image items remain in the DB and continue to display, but the user can't create new ones. They can keep using the app for snippet/prompt/etc. This matches Notion/Dropbox patterns. Confirm before launch.
- **Tax (Stripe Tax)?** Recommended to enable pre-launch for US/EU sales. Adds `automatic_tax: { enabled: true }` to the checkout config. Stripe Tax requires merchant-of-record setup; out of scope for v1.
- **Email receipts?** Stripe sends automatic invoice emails to the customer if `customer.email` is set (it is — passed in `stripe.customers.create`). No extra work needed.

### Deliberately out of scope for v1

- AI feature gating (no AI features exist yet).
- Custom item type gating (no custom types exist yet).
- Export gating (no export exists yet).
- Free-tier "watermark" on exports.
- Per-feature granular pricing (everything is one $8/$72 tier).
- Multi-seat / team plans.
- Annual prepay invoicing (only credit-card subscriptions).
- Webhook event dedup table (relying on `updateMany` idempotency).
- Daily reconciliation cron (manual reconciliation only for v1).
- In-app announcements when a user hits 80% of their item/collection quota.
- A `/pricing` standalone page (the homepage `#pricing` section is the only price surface).

### Risks / things to watch

- **JWT callback adds a DB read to every authenticated request.** Measured impact at v1 scale (tens of users): negligible. If it becomes a hotspot, cache `isPro` in Redis keyed by `userId` with webhook-driven invalidation.
- **`stripeCustomerId` collision is impossible** (Stripe-issued ids are unique), but the schema's `@unique` constraint protects us if any data ever gets cross-wired.
- **Webhook signature secret rotation** — when the secret is rotated in Stripe, update `STRIPE_WEBHOOK_SECRET` in env and redeploy. Stripe supports two secrets simultaneously for zero-downtime rotation; we'd need to support both, but that's a v2 concern.
- **`auth.config.ts` edge safety** — if any future code moves to running `proxy.ts` on a true edge runtime, the JWT callback's DB read will break. The recommended move (callbacks in `auth.ts` not `auth.config.ts`) protects against this; tests catch regressions.
