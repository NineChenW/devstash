import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { getAppUrl, getPriceId, isStripeConfigured } from "./stripe"

const STRIPE_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_MONTHLY",
  "STRIPE_PRICE_ID_YEARLY",
] as const

const APP_URL_KEYS = ["APP_URL", "NEXT_PUBLIC_APP_URL", "AUTH_URL"] as const

describe("isStripeConfigured", () => {
  const originals: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of STRIPE_KEYS) originals[k] = process.env[k]
  })

  afterEach(() => {
    for (const k of STRIPE_KEYS) {
      if (originals[k] === undefined) delete process.env[k]
      else process.env[k] = originals[k]
    }
  })

  it("returns true when both STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x"
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_x"
    expect(isStripeConfigured()).toBe(true)
  })

  it("returns false when STRIPE_SECRET_KEY is missing", () => {
    delete process.env.STRIPE_SECRET_KEY
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_x"
    expect(isStripeConfigured()).toBe(false)
  })

  it("returns false when STRIPE_WEBHOOK_SECRET is missing", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x"
    delete process.env.STRIPE_WEBHOOK_SECRET
    expect(isStripeConfigured()).toBe(false)
  })

  it("returns false when both are unset", () => {
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET
    expect(isStripeConfigured()).toBe(false)
  })

  it("price ID env vars do not affect isStripeConfigured", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x"
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_x"
    delete process.env.STRIPE_PRICE_ID_MONTHLY
    delete process.env.STRIPE_PRICE_ID_YEARLY
    expect(isStripeConfigured()).toBe(true)
  })
})

describe("getPriceId", () => {
  const originals: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of STRIPE_KEYS) originals[k] = process.env[k]
  })

  afterEach(() => {
    for (const k of STRIPE_KEYS) {
      if (originals[k] === undefined) delete process.env[k]
      else process.env[k] = originals[k]
    }
  })

  it("returns STRIPE_PRICE_ID_MONTHLY for plan='monthly'", () => {
    process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_x"
    expect(getPriceId("monthly")).toBe("price_monthly_x")
  })

  it("returns STRIPE_PRICE_ID_YEARLY for plan='yearly'", () => {
    process.env.STRIPE_PRICE_ID_YEARLY = "price_yearly_x"
    expect(getPriceId("yearly")).toBe("price_yearly_x")
  })

  it("throws when STRIPE_PRICE_ID_MONTHLY is missing", () => {
    delete process.env.STRIPE_PRICE_ID_MONTHLY
    expect(() => getPriceId("monthly")).toThrow("STRIPE_PRICE_ID_MONTHLY is not set")
  })

  it("throws when STRIPE_PRICE_ID_YEARLY is missing", () => {
    delete process.env.STRIPE_PRICE_ID_YEARLY
    expect(() => getPriceId("yearly")).toThrow("STRIPE_PRICE_ID_YEARLY is not set")
  })
})

describe("getAppUrl", () => {
  const originals: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of APP_URL_KEYS) originals[k] = process.env[k]
    for (const k of APP_URL_KEYS) delete process.env[k]
  })

  afterEach(() => {
    for (const k of APP_URL_KEYS) {
      if (originals[k] === undefined) delete process.env[k]
      else process.env[k] = originals[k]
    }
  })

  it("returns http://localhost:3000 when nothing is set", () => {
    expect(getAppUrl()).toBe("http://localhost:3000")
  })

  it("prefers APP_URL over the other fallbacks", () => {
    process.env.APP_URL = "https://app.example.com"
    process.env.NEXT_PUBLIC_APP_URL = "https://public.example.com"
    process.env.AUTH_URL = "https://auth.example.com"
    expect(getAppUrl()).toBe("https://app.example.com")
  })

  it("falls back to NEXT_PUBLIC_APP_URL when APP_URL is unset", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://public.example.com"
    process.env.AUTH_URL = "https://auth.example.com"
    expect(getAppUrl()).toBe("https://public.example.com")
  })

  it("falls back to AUTH_URL when APP_URL and NEXT_PUBLIC_APP_URL are unset", () => {
    process.env.AUTH_URL = "https://auth.example.com"
    expect(getAppUrl()).toBe("https://auth.example.com")
  })

  it("strips a trailing slash", () => {
    process.env.APP_URL = "https://app.example.com/"
    expect(getAppUrl()).toBe("https://app.example.com")
  })

  it("does not strip non-trailing slashes", () => {
    process.env.APP_URL = "https://app.example.com/path"
    expect(getAppUrl()).toBe("https://app.example.com/path")
  })
})
