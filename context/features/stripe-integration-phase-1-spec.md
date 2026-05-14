# Stripe Integration — Phase 1 (Core Infrastructure)

## Overview

Foundational layer for Stripe billing. Lands the Stripe client wrapper, the DB-access helpers for billing fields, the pure usage-limits module (with unit tests), and the JWT-callback wiring that propagates `User.isPro` into every server-side session read. **No checkout, no webhook, no UI surfaces** — those live in Phase 2.

After Phase 1 ships:
- The codebase can call Stripe APIs (when env is configured) without breaking when env is missing.
- `session.user.isPro` is available everywhere `auth()` is called, sourced fresh from the DB on each session validation.
- Pure usage-limit predicates can be unit-tested and reused by Phase 2's UI / action gates.

Reference: [docs/stripe-integration-plan.md](../../docs/stripe-integration-plan.md).

## Requirements

### 1. No schema migration needed

The `User` model already has `isPro`, `stripeCustomerId`, and `stripeSubscriptionId` — see [prisma/schema.prisma:13-32](../../prisma/schema.prisma#L13-L32). Verify with `prisma migrate status` only; **do not** run `db push` or create a new migration.

### 2. `.env.example` cleanup

Edit [.env.example](../../.env.example) lines 41–45:
- Remove `STRIPE_PUBLISHABLE_KEY` — Phase 2 uses server-only redirect Checkout, no client SDK.
- Keep `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`.
- Add a comment block explaining: required for Phase 2 (`/api/stripe/webhook` and `/settings` billing UI); when unset, billing actions return "not configured" errors and the billing UI hides; pre-existing `isPro=true` users are unaffected.

### 3. `src/lib/stripe.ts` — lazy-cached Stripe client

Mirror the lazy-cache pattern from [src/lib/email.ts:3-11](../../src/lib/email.ts#L3-L11) and [src/lib/r2.ts](../../src/lib/r2.ts) — module-scope `let cached: Stripe | null = null`; lazy initializer reads env at first call; errors only surface on a real call, not at import time.

Exports:
- `getStripe(): Stripe` — returns the cached client; throws `STRIPE_SECRET_KEY is not set` if env missing. Pin `apiVersion` to the version we test against (latest stable at implementation time, e.g. `'2025-09-30.acacia'`), `typescript: true`.
- `isStripeConfigured(): boolean` — `Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)`. Used by Phase 2 routes / actions to return graceful 503s instead of crashing.
- `getPriceId(plan: 'monthly' | 'yearly'): string` — reads `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`; throws if missing.
- `getAppUrl(): string` — reads `APP_URL || NEXT_PUBLIC_APP_URL || AUTH_URL || 'http://localhost:3000'`, strips trailing slash. Used to build Stripe `success_url` / `cancel_url` in Phase 2.

Install dependency: `npm install stripe` (latest stable major).

### 4. `src/lib/db/billing.ts` — billing DB queries

New module. Exports:

```typescript
export interface BillingUser {
  id: string
  email: string | null
  name: string | null
  isPro: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

export async function getBillingUser(userId: string): Promise<BillingUser | null>
export async function setStripeCustomerId(userId: string, customerId: string): Promise<void>
export async function applySubscriptionState(args: {
  stripeCustomerId: string
  stripeSubscriptionId: string | null
  isPro: boolean
}): Promise<void>
```

Notes:
- `getBillingUser` selects only the six fields above — no extra columns.
- `setStripeCustomerId` uses `prisma.user.update({ where: { id }, data: { stripeCustomerId } })`.
- `applySubscriptionState` uses `prisma.user.updateMany({ where: { stripeCustomerId }, data: {...} })`. `updateMany` (not `update`) because `stripeCustomerId` is `@unique` but Prisma's `update()` requires the primary key. `updateMany` lets us update by the unique non-id column without an extra `findUnique` round-trip — this is the canonical pattern for webhook handlers in Phase 2.

### 5. `src/lib/usage-limits.ts` — pure feature-gate helpers (with tests)

**This is the testable surface.** Pure logic + minimal Prisma counts. Exports:

```typescript
export const FREE_ITEM_LIMIT = 50
export const FREE_COLLECTION_LIMIT = 3
export const PRO_ITEM_TYPES = new Set(['file', 'image'] as const)

export interface QuotaCheck {
  ok: boolean
  used: number
  limit: number
  error?: string
}

export class QuotaExceededError extends Error {
  constructor(message: string)
}

export async function checkItemQuota(args: {
  userId: string
  isPro: boolean
  typeName: string
}): Promise<QuotaCheck>

export async function checkCollectionQuota(args: {
  userId: string
  isPro: boolean
}): Promise<QuotaCheck>

export function gateForUploadKind(args: {
  isPro: boolean
  kind: 'file' | 'image'
}): { ok: boolean; error?: string }
```

Behavior:
- **Pro users always pass** (`ok: true`, `limit: Infinity`).
- **Free users + Pro-only type (`file`/`image`)** → `ok: false` with `${kind} items are a Pro feature.` error.
- **Free users + count >= limit** → `ok: false` with `You've reached the free plan's N-item limit. Upgrade to Pro for unlimited items.` error. Counts come from `prisma.item.count` / `prisma.collection.count` keyed by `userId`.
- `gateForUploadKind` is pure (no DB) — synchronously rejects free users for both kinds.
- `QuotaExceededError` is exported so Phase 2's DB-layer + server actions can throw + catch a typed error rather than a plain `Error`.

### 6. `src/lib/usage-limits.test.ts` — Vitest unit tests

Per [coding-standards.md](../../context/coding-standards.md): pure-logic branches only — **do not mock Prisma**. The count-based branches in `checkItemQuota` / `checkCollectionQuota` rely on `prisma.count()` and are out of unit-test scope (deferred to real-DB integration tests, not yet wired up).

In scope:
- `checkItemQuota`: Pro user bypasses (any type, count irrelevant — assert `ok: true`); free user + `'file'` type → `ok: false` with the right error; free user + `'image'` type → same.
- `checkCollectionQuota`: Pro user bypasses (assert `ok: true`).
- `gateForUploadKind`: Pro + file → ok; Pro + image → ok; free + file → not ok with the right error; free + image → not ok with the right error.

Don't write tests that would only pass with a Prisma mock — those branches stay uncovered until real-DB integration is wired up.

Expected new test count: ~7 cases. Suite should grow from 168 → ~175.

### 7. JWT callback — sync `isPro` from DB

Per [docs/stripe-integration-plan.md §7](../../docs/stripe-integration-plan.md) and the workaround for JWT sessions (DevStash uses `session: { strategy: "jwt" }` from [src/auth.ts:25](../../src/auth.ts#L25)): JWTs are stateless, so a webhook flipping `isPro` in the DB doesn't propagate to existing sessions. Workaround is to re-read `User.isPro` inside the JWT callback on every session validation.

**Critical placement decision:** [src/auth.config.ts](../../src/auth.config.ts) is edge-safe (no Prisma import) so [src/proxy.ts](../../src/proxy.ts) can run it on the edge. Adding `prisma` to `auth.config.ts` would break that.

→ **Move the JWT/session callbacks into [src/auth.ts](../../src/auth.ts)** (the Node-runtime wrapper that already imports Prisma via the adapter). The structure:

- Keep `auth.config.ts` as-is for `proxy.ts`'s edge use (it just checks `isLoggedIn`, doesn't need `isPro`).
- In `auth.ts`, override the callbacks block when constructing the final `NextAuth(...)` config. The JWT callback queries `prisma.user.findUnique({ where: { id }, select: { isPro: true } })` and sets `token.isPro = dbUser?.isPro ?? false`. The session callback copies `token.isPro` onto `session.user.isPro`.

One extra DB read per session validation. Acceptable at current scale — see plan §7 for the "if perf ever matters" Redis-cache option (deferred).

### 8. `src/types/next-auth.d.ts` — augment `isPro`

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

After this lands, every `auth()` call site can read `session.user.isPro` without a TS error.

## Implementation Order

Three commits on a `feature/stripe-integration-phase-1` branch:

1. **`chore(billing): add stripe client + db helpers`**
   - [src/lib/stripe.ts](../../src/lib/stripe.ts), [src/lib/db/billing.ts](../../src/lib/db/billing.ts), `.env.example` cleanup.
   - No behavior change to any existing surface. Pure scaffolding.

2. **`feat(billing): add usage-limits module with unit tests`**
   - [src/lib/usage-limits.ts](../../src/lib/usage-limits.ts) + [src/lib/usage-limits.test.ts](../../src/lib/usage-limits.test.ts).
   - Verify `npm run test:run` passes with ~7 new cases (suite 168 → ~175).

3. **`feat(auth): sync user.isPro into JWT session`**
   - Move JWT/session callbacks from `auth.config.ts` into `auth.ts` and add the Prisma-backed `isPro` read.
   - [src/types/next-auth.d.ts](../../src/types/next-auth.d.ts) augmentation.
   - Verify `proxy.ts` still works (edge-safe path unchanged — `auth.config.ts` keeps no Prisma import).

## Testing Checklist

- [ ] `npm run test:run` — usage-limits tests pass, total suite goes 168 → ~175.
- [ ] `npm run build` — clean, no new TS errors.
- [ ] `npm run lint` — no new errors above the existing baseline (4 pre-existing on main).
- [ ] **Unauthenticated `/dashboard` still redirects to `/sign-in`** (regression check on `proxy.ts` edge runtime).
- [ ] Sign in as the demo user → `session.user.isPro` is `false` (default) — verify by adding a temporary `console.log(session.user.isPro)` to any page that calls `auth()`, then remove.
- [ ] **Manual DB flip:** set `demo@devstash.io`'s `isPro = true` via SQL → re-render any authenticated page → `session.user.isPro` reads `true` without re-sign-in. Then flip back to `false`.
- [ ] **Without Stripe env vars set:** verify the app builds and runs (lazy-cache means missing env doesn't break anything until `getStripe()` is actually called — which only happens in Phase 2).

## Notes

- **No Stripe CLI needed for Phase 1.** Everything here is unit-testable or DB-only; no webhook deliveries, no Checkout sessions. Phase 2 adds the Stripe CLI dependency for `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
- The "usage-limits" name (vs the plan's `gates.ts`) is intentional — it's more descriptive and reads cleanly at the call site (`checkItemQuota` is a usage-limit check, not a generic gate).
- `QuotaExceededError` is defined here but not yet thrown anywhere — Phase 2 wires it into the DB layer and server actions. Defining it now keeps Phase 1 self-contained and gives Phase 2 a typed error class to import.
- Per [coding-standards.md](../../context/coding-standards.md): the DB query branches in `checkItemQuota` / `checkCollectionQuota` are intentionally untested (no Prisma mocking). The pure branches (Pro bypass + type-name gating + `gateForUploadKind`) are the testable surface.
- Per the dev override mentioned in [project-overview.md](../../context/project-overview.md) ("during development, all users have access to all features regardless of `isPro`"): Phase 1 does **not** add any dev override — the usage-limits functions report what the data says. The dev override lives in Phase 2's action-layer wiring (where we can short-circuit on `NODE_ENV !== 'production'`).
- Out of scope for Phase 1: Checkout, webhook handler, `/settings` Billing UI, feature-gating wiring into items/collections/upload, Pro CTA repoint on the homepage, Stripe Dashboard setup. All Phase 2.
- After Phase 1 lands, the `isPro` field is available everywhere but nothing reads it in production code yet — the only consumer is the test file. That's expected; Phase 2 is the consumer.
