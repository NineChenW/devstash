import Stripe from "stripe"

let cached: Stripe | null = null

export function getStripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  cached = new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  })
  return cached
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
  )
}

export function getPriceId(plan: "monthly" | "yearly"): string {
  const envVar = plan === "monthly" ? "STRIPE_PRICE_ID_MONTHLY" : "STRIPE_PRICE_ID_YEARLY"
  const value = process.env[envVar]
  if (!value) throw new Error(`${envVar} is not set`)
  return value
}

export function getAppUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "")
}
