# Stripe Integration — Phase 2 (Integration & UI)

## Overview

Builds on Phase 1's infrastructure to wire up real billing: Stripe Checkout via server-action redirect, Customer Portal for plan management, a signed webhook handler that flips `isPro` on subscription events, the `/settings` Billing section, in-context upgrade prompts, and full feature gating across items / collections / uploads / sidebar / homepage Pro CTA.

**Prerequisites:** Phase 1 merged. `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY` set locally. Stripe CLI installed (`brew install stripe/stripe-cli/stripe` or platform equivalent) for local webhook delivery.

After Phase 2 ships:
- A free user can click "Upgrade to Pro" on `/settings`, complete Stripe Checkout, get redirected back, and see `isPro: true` propagate without a re-sign-in.
- A Pro user can click "Manage billing" on `/settings`, open the Customer Portal, and cancel / switch plans.
- Subscription state stays in sync via the webhook regardless of how the user gets to Stripe (Checkout, Portal, dunning).
- Free users hit clean 403s / disabled UI when they try to exceed the 50-item / 3-collection limits or use file/image item types.

Reference: [docs/stripe-integration-plan.md](../../docs/stripe-integration-plan.md), specifically §3 (Dashboard setup), §4.4–§4.9 (files to create), §5 (files to modify), §8 (testing).

## Requirements

### 1. Stripe Dashboard setup (test mode first)

Follow [docs/stripe-integration-plan.md §3](../../docs/stripe-integration-plan.md). Concretely:

- Create one product "DevStash Pro" with two prices: $8/mo and $72/yr USD recurring. Capture both `price_…` ids into `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`.
- Get the test secret key → `STRIPE_SECRET_KEY`.
- Create a webhook endpoint pointing at `https://<your-app>/api/stripe/webhook` (for production) or via Stripe CLI forwarding (for local dev — see §8 below). Subscribe to:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed` (optional, for v2 dunning emails — handler can ignore for v1)
- Reveal the signing secret → `STRIPE_WEBHOOK_SECRET`.
- Enable Customer Portal (Settings → Billing → Customer Portal → Activate test link). Allow: payment-method update, subscription cancel, plan switch between Monthly/Yearly. Allow customer email/name updates.

Repeat in live mode at launch (separate keys + separate webhook endpoint).

### 2. `src/actions/billing.ts` — Checkout + Portal server actions

`'use server'` module. Two exported actions, both returning the standard discriminated union:

```typescript
export type CreateCheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string }

export async function createCheckoutSession(plan: 'monthly' | 'yearly'): Promise<CreateCheckoutResult>

export type CreatePortalResult =
  | { success: true; url: string }
  | { success: false; error: string }

export async function createBillingPortalSession(): Promise<CreatePortalResult>
```

Both actions:
- `auth()` gate → `{ success: false, error: 'Not authenticated' }` on null session.
- `isStripeConfigured()` short-circuit → `{ success: false, error: 'Billing is not configured on this server' }`.
- **Critical:** do **not** use `getDemoUserId()` — billing must operate on the real signed-in user; otherwise demo would accumulate Stripe customers. Resolve with `session.user.id` directly.
- Use `getBillingUser(session.user.id)` from Phase 1's [src/lib/db/billing.ts](../../src/lib/db/billing.ts).

`createCheckoutSession` specifics:
- Validate `plan` ∈ `'monthly' | 'yearly'`.
- Reject if `user.isPro` already true (`'Already subscribed'`).
- If `user.stripeCustomerId` is null, create the customer via `stripe.customers.create({ email, name, metadata: { userId } })` and persist via `setStripeCustomerId`.
- Create checkout session: `mode: 'subscription'`, `customer: customerId`, `line_items: [{ price: getPriceId(plan), quantity: 1 }]`, `success_url: ${appUrl}/settings?checkout=success`, `cancel_url: ${appUrl}/settings?checkout=cancelled`, `allow_promotion_codes: true`, `client_reference_id: user.id`, `subscription_data: { metadata: { userId: user.id } }`.
- Return `checkout.url` or `'Stripe did not return a checkout URL'`.

`createBillingPortalSession` specifics:
- Reject if `user.stripeCustomerId` is null (`'No billing account found. Subscribe first.'`).
- `stripe.billingPortal.sessions.create({ customer, return_url: \`${appUrl}/settings\` })`.

### 3. `src/app/api/stripe/webhook/route.ts` — webhook handler

```typescript
export const runtime = 'nodejs' // Stripe SDK uses Node crypto for signature verification
```

POST handler:
1. `isStripeConfigured()` → 503 if not.
2. Read `stripe-signature` header → 400 if missing.
3. **`await req.text()` (not `.json()`)** — raw bytes required for signature verification; parsing as JSON re-serializes and invalidates the signature.
4. `stripe.webhooks.constructEvent(body, sig, secret)` → 400 on invalid signature.
5. Dispatch by `event.type`:
   - `checkout.session.completed` (mode === 'subscription'): retrieve the subscription, call `applySubscriptionState({ stripeCustomerId, stripeSubscriptionId, isPro: ACTIVE_STATUSES.has(sub.status) })`.
   - `customer.subscription.created` / `customer.subscription.updated` / `customer.subscription.deleted`: pull `customerId` off the subscription, compute `isPro` (false for `deleted` regardless of status, otherwise `ACTIVE_STATUSES.has(sub.status)`), call `applySubscriptionState`. On delete, set `stripeSubscriptionId: null`.
   - Default: ignore.
6. Return `NextResponse.json({ received: true })` on success; 500 with error log on handler failure.

`ACTIVE_STATUSES = new Set(['active', 'trialing'])`. Intentionally **excludes** `'past_due'` — those users need to resolve payment before they keep Pro access.

**Idempotency:** the handler is naturally idempotent because `applySubscriptionState` is an unconditional `updateMany` keyed by `customerId`. Stripe will retry failed deliveries for up to 3 days; retries are safe. If we later add side effects (welcome email, etc.), wrap them in an `event.id`-keyed dedup check via a new `WebhookEvent` table — out of scope for v1.

### 4. `src/components/settings/BillingSection.tsx` — settings UI

`'use client'` component. Two states based on `isPro` prop:

**Free user:**
- "Plan: Free" header + usage line: `${itemsUsed} / ${itemLimit} items · ${collectionsUsed} / ${collectionLimit} collections`.
- Monthly / Yearly toggle (`useState<'monthly' | 'yearly'>('monthly')`) — two `<button>`s styled with `aria-pressed`, active state uses primary bg.
- "Upgrade to Pro" `<Button>` calls `createCheckoutSession(plan)`. On success: `window.location.href = res.url`. On failure: `toast.error(res.error)`. Uses `useTransition` for the pending state.

**Pro user:**
- "Plan: DevStash Pro — unlimited everything."
- "Manage billing" `<Button>` calls `createBillingPortalSession()`. Same URL-redirect + toast pattern.

Props:

```typescript
interface BillingSectionProps {
  isPro: boolean
  itemsUsed: number
  collectionsUsed: number
  itemLimit: number
  collectionLimit: number
}
```

### 5. `src/components/settings/BillingToast.tsx` — checkout success/cancel toast

Small `'use client'` component. Reads `?checkout=success` / `?checkout=cancelled` from URL via `useSearchParams`, fires `toast.success('Processing your subscription…')` or `toast.message('Checkout cancelled')` on mount, then `router.replace('/settings')` to scrub the query param.

The "Processing…" copy plus a 3-second `setTimeout` + `router.refresh()` is the simplest reconciliation path — when the webhook fires (1–3 sec typically), `getBillingUser` re-fetches and the page re-renders as Pro. **Do not build the optional `/api/billing/status` poll endpoint** ([plan §4.9](../../docs/stripe-integration-plan.md)) — the refresh approach works for v1.

### 6. `src/components/billing/UpgradePrompt.tsx` — in-context upsell

Reusable inline upgrade card. Props: `feature: string` (required) and `description?: string` (optional). Renders a dashed-border muted card with `Lock` icon, headline `${feature} is a Pro feature`, optional description, and an "Upgrade to Pro" button that links to `/settings#billing`.

Used by feature-gated UIs: file upload dialog when free user picks file/image type, collection-limit hit state, item-limit hit state.

### 7. Modify `src/app/settings/page.tsx` — add Billing section

Insert above the existing Editor Preferences section so Billing is the first thing users see (it's the highest-stakes section).

```diff
+ import { BillingSection } from '@/components/settings/BillingSection'
+ import { BillingToast } from '@/components/settings/BillingToast'
+ import { getBillingUser } from '@/lib/db/billing'
+ import { FREE_ITEM_LIMIT, FREE_COLLECTION_LIMIT } from '@/lib/usage-limits'
+ import { prisma } from '@/lib/prisma'
```

Parallelize the fetches:

```typescript
const [user, billing, itemsUsed, collectionsUsed] = await Promise.all([
  getProfileUser(session.user.id),
  getBillingUser(session.user.id),
  prisma.item.count({ where: { userId: session.user.id } }),
  prisma.collection.count({ where: { userId: session.user.id } }),
])
```

Render `<BillingToast />` near the top of `<main>`. Add a Billing `<section id="billing">` above Editor Preferences wrapping `<BillingSection ... />`.

### 8. Wire feature gating into items / collections / upload

**`src/lib/db/items.ts::createItem`** — gate with `checkItemQuota`. New signature:

```diff
  export async function createItem(
    userId: string,
+   isPro: boolean,
    data: CreateItemInput,
  ): Promise<ItemDetail | null> {
+   const quota = await checkItemQuota({ userId, isPro, typeName: data.typeName })
+   if (!quota.ok) {
+     throw new QuotaExceededError(quota.error ?? 'Quota exceeded')
+   }
    // ... existing logic
  }
```

**`src/actions/items.ts::createItem`** — thread `isPro` through, catch `QuotaExceededError`:

```diff
+   const isPro = isProForGating(session)
    try {
-     const created = await createItemQuery(ownerId, { ... })
+     const created = await createItemQuery(ownerId, isPro, { ... })
    } catch (err) {
+     if (err instanceof QuotaExceededError) {
+       return { success: false, error: err.message }
+     }
      // ...
    }
```

Add a small helper at the top of `src/actions/items.ts`:

```typescript
function isProForGating(session: { user: { isPro?: boolean } }): boolean {
  if (process.env.NODE_ENV !== 'production') return true // dev override per project-overview.md
  return Boolean(session.user.isPro)
}
```

This honors the [project-overview.md](../../context/project-overview.md) dev rule ("during development, all users have access to all features regardless of `isPro`"). Use the same helper everywhere we read `isPro` for gating.

**`src/lib/db/collections.ts::createCollection` + `src/actions/collections.ts::createCollection`** — same pattern with `checkCollectionQuota`.

**`src/app/api/upload/route.ts`** — gate uploads:

```diff
+ import { gateForUploadKind } from '@/lib/usage-limits'

  export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!isR2Configured()) return NextResponse.json({ error: '...' }, { status: 503 })

+   const isPro = isProForGating(session)
+   // ... parse kind from formData first ...
+   const gate = gateForUploadKind({ isPro, kind: kindFromForm })
+   if (!gate.ok) {
+     return NextResponse.json({ error: gate.error }, { status: 403 })
+   }
    // ... rest unchanged
  }
```

`isProForGating` should be exported from a shared spot (`src/lib/usage-limits.ts` is fine — it's the natural home) so both server actions and API routes share it.

### 9. UI gating

**`src/components/items/CreateItemDialog.tsx`** — hide `file` and `image` from the type selector for free users. Pass `isPro` down from `DashboardShell` (cleanest — `DashboardShell` already fetches plenty of server data; one more `getBillingUser` call is fine) rather than adding `SessionProvider` + `useSession()`. When a free user has the dialog open, the picker shows only the 5 non-Pro types plus a small footer link `"Need files & images? Upgrade to Pro"` → `/settings#billing`.

**`src/components/sidebar/Sidebar.tsx`** — gate the PRO badge on `file` / `image` rows by `userIsPro` (currently the badge renders for all users regardless of plan). Pro users hide the badge entirely (label is noise to them); free users keep seeing it as the upsell signal:

```diff
- const isPro = PRO_TYPES.has(type.name)
+ const isProType = PRO_TYPES.has(type.name)
+ const showProBadge = isProType && !userIsPro
```

Pass `userIsPro` from `DashboardShell` (same plumbing as `CreateItemDialog`).

**`src/components/home/PricingSection.tsx`** — repoint the Pro CTA. Today both Free and Pro CTAs link to `/register`. After Phase 2:
- Unauthenticated visitor → keep `/register?plan=monthly` (or `yearly`) so the funnel stays single-entry. Update `/register` to read `?plan` and store it in a cookie or pass it as a redirect param; after sign-up, redirect to `/settings#billing?plan=...` with the plan preselected.
- Authenticated visitor → link directly to `/settings#billing?plan=...`. The simplest path: let `/register`'s page-level server-side check redirect logged-in users to `/settings#billing?plan=...` and keep PricingSection's CTAs unchanged.

### 10. `.env.example` already documents the required vars

(Done in Phase 1.) Just verify they're set locally before testing.

## Stripe CLI — Local Testing

Install: `brew install stripe/stripe-cli/stripe` (macOS) or follow https://stripe.com/docs/stripe-cli for other platforms.

Login: `stripe login` (one-time, opens browser to authorize).

Forward webhooks to local dev:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The command prints a webhook signing secret (`whsec_…`) on first run — paste that as `STRIPE_WEBHOOK_SECRET` in your local `.env`. Keep this terminal window open during testing; the CLI streams every event it forwards.

Trigger specific events (in another terminal):
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

## Testing Checklist

### Build / lint / test

- [ ] `npm run build` — clean, no new TS errors.
- [ ] `npm run lint` — no new errors above the existing baseline.
- [ ] `npm run test:run` — Phase 1's usage-limits tests still pass; no new tests expected in Phase 2 (action / route / UI code is all DB-touching or component-level, out of scope per [coding-standards.md](../../context/coding-standards.md)).

### Manual happy path (test mode + Stripe CLI)

- [ ] Sign in as a **non-demo** user (the demo `getDemoUserId()` shortcut is bypassed for billing — billing operates on the real signed-in user; create a fresh test account).
- [ ] **Without `NODE_ENV=production`:** verify everything still works as Pro (dev override). Set `NODE_ENV=production` temporarily for the gating tests below, or test in a deployed preview environment.
- [ ] `/settings#billing` renders the Free plan card with correct usage counts.
- [ ] Toggle to Yearly → price label updates.
- [ ] Click "Upgrade to Pro" → redirected to Stripe Checkout → use test card `4242 4242 4242 4242`, any future date, any CVC.
- [ ] Redirected back to `/settings?checkout=success` → toast fires.
- [ ] `stripe listen` terminal shows `checkout.session.completed` event delivered → app webhook returns 200 → DB shows `isPro: true`, `stripeCustomerId` populated, `stripeSubscriptionId` populated.
- [ ] After ~3 sec the page refreshes and shows "Plan: DevStash Pro" with the "Manage billing" button.
- [ ] Click "Manage billing" → Customer Portal opens → cancel subscription.
- [ ] Portal cancellation fires `customer.subscription.updated` (`cancel_at_period_end: true`) → `isPro` stays `true` (cancellation pending until period end is the correct behavior).
- [ ] In Stripe Dashboard, click "Cancel immediately" on the subscription → `customer.subscription.deleted` fires → `isPro` flips to `false` → page re-renders as Free without re-sign-in.

### Gating enforcement (with `NODE_ENV=production` to bypass dev override)

- [ ] As a free user, create 50 items → 51st rejected at the server with the right error toast. The "New Item" button on the dashboard should also be disabled / show a tooltip when at the limit.
- [ ] As a free user, create 3 collections → 4th rejected.
- [ ] As a free user, attempt `POST /api/upload` with `kind=file` via curl with auth cookie → 403 with the right error message.
- [ ] As a free user, open the Create Item dialog → `file` and `image` types are absent from the picker; small "Need files & images? Upgrade to Pro" footer link is visible.
- [ ] As a free user, sidebar shows PRO badge on `file` / `image` rows.
- [ ] As a Pro user, sidebar PRO badges are hidden on those rows.

### Stripe not configured

- [ ] Unset `STRIPE_SECRET_KEY` → `/settings` renders without errors; clicking "Upgrade to Pro" surfaces "Billing is not configured on this server" toast.
- [ ] `POST /api/stripe/webhook` returns 503 in this state.

### Webhook signature failure

- [ ] `curl -X POST localhost:3000/api/stripe/webhook -d '{}'` (no signature header) → 400.
- [ ] Same with a garbage `stripe-signature` header → 400.

## Implementation Order

Five commits on a `feature/stripe-integration-phase-2` branch:

1. **`feat(billing): create checkout + portal server actions`**
   - [src/actions/billing.ts](../../src/actions/billing.ts).
   - No UI surfaces yet. Verify by invoking the action from a temp page or repl-style script.

2. **`feat(billing): add stripe webhook handler`**
   - [src/app/api/stripe/webhook/route.ts](../../src/app/api/stripe/webhook/route.ts).
   - Test with `stripe listen` + `stripe trigger checkout.session.completed`.

3. **`feat(billing): wire billing UI into /settings`**
   - [src/components/settings/BillingSection.tsx](../../src/components/settings/BillingSection.tsx), [src/components/settings/BillingToast.tsx](../../src/components/settings/BillingToast.tsx), [src/app/settings/page.tsx](../../src/app/settings/page.tsx).
   - End-to-end happy path testable after this.

4. **`feat(billing): enforce free-tier quotas + pro-only types`**
   - [src/lib/db/items.ts](../../src/lib/db/items.ts), [src/actions/items.ts](../../src/actions/items.ts), [src/lib/db/collections.ts](../../src/lib/db/collections.ts), [src/actions/collections.ts](../../src/actions/collections.ts), [src/app/api/upload/route.ts](../../src/app/api/upload/route.ts).
   - Add the `isProForGating(session)` helper to [src/lib/usage-limits.ts](../../src/lib/usage-limits.ts).
   - Largest commit; if it grows past ~500 lines, split items/collections from upload.

5. **`feat(billing): gate UI surfaces and repoint pro cta`**
   - [src/components/items/CreateItemDialog.tsx](../../src/components/items/CreateItemDialog.tsx), [src/components/sidebar/Sidebar.tsx](../../src/components/sidebar/Sidebar.tsx), [src/components/billing/UpgradePrompt.tsx](../../src/components/billing/UpgradePrompt.tsx), [src/components/home/PricingSection.tsx](../../src/components/home/PricingSection.tsx).
   - Plumb `isPro` from `DashboardShell` into the components that need it.

## Notes

- **Stripe CLI is required for testing this phase locally.** Without `stripe listen`, the webhook never fires and `isPro` won't flip — Checkout succeeds, the user lands on `/settings?checkout=success`, but the page never updates. Document this clearly in the README or the implementation history so the next person doesn't get confused.
- **`getDemoUserId()` is deliberately bypassed for all billing operations.** The demo-user shortcut exists for seeded items/collections; using it for Stripe customers would create one Stripe customer per developer machine and cross-pollute test data.
- **Dev override (`NODE_ENV !== 'production'` → `isPro=true`).** All users behave as Pro in development per the [project-overview.md](../../context/project-overview.md) rule. Useful for local development; required for the demo user to work normally. To test the gating itself locally, run a one-off build with `NODE_ENV=production` or use a deployed preview environment.
- **JWT staleness window.** After Checkout completes and the webhook flips `isPro` in the DB, the next session validation re-reads `isPro` from the DB (Phase 1's JWT callback). Server-rendered pages refresh on `router.refresh()`; client components that already mounted with `isPro: false` need a router refresh to see the change. The `BillingToast` handles this via `router.refresh()` after 3 sec.
- **Stripe API version pinning.** Phase 1 pinned `apiVersion` in `src/lib/stripe.ts`. Stripe will deprecate this version eventually (~12 months); upgrade requires reading the changelog and re-testing the webhook payload shapes. Out of scope for now.
- **Webhook reliability.** Stripe retries failed deliveries with exponential backoff for up to 3 days. The handler is idempotent (unconditional `updateMany`), so retries are safe. If a webhook fails permanently, manual recovery is: re-trigger via Stripe Dashboard → Events, or run a one-off script that calls `applySubscriptionState` from a `stripe.subscriptions.list` walk. Long-term: a daily reconciliation cron — out of scope for v1.
- **Tax + email receipts.** Stripe sends automatic invoice emails when `customer.email` is set (it is — passed in `stripe.customers.create`). Tax (Stripe Tax) is recommended pre-launch but out of scope for v1.
- **Out of scope for Phase 2:** AI feature gating, custom item type gating (no custom types exist yet), export gating (no export exists yet), free-tier watermarks, multi-seat / team plans, annual prepay invoicing, webhook event-dedup table (rely on `updateMany` idempotency), daily reconciliation cron, 80%-of-quota in-app notifications, a standalone `/pricing` page.
- **Open questions to confirm before launch:** (a) should the demo user be seeded with `isPro=true` in production so file/image items work for visitors? (b) should `allow_promotion_codes: true` ship enabled by default? (c) what happens to existing file/image items when a Pro user downgrades — current plan is "items stay but can't create new ones" matching Notion/Dropbox. See [docs/stripe-integration-plan.md §10](../../docs/stripe-integration-plan.md) for the full open-questions list.
- The [docs/stripe-integration-plan.md](../../docs/stripe-integration-plan.md) reference has full code samples for every file mentioned here. Use it as the implementation reference; this spec is the scope + ordering + testing layer.
