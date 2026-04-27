import { describe, it, expect, vi, afterEach } from "vitest"
import { getRequestIp, buildRateLimitKey, minutesUntil } from "@/lib/rate-limit"

describe("getRequestIp", () => {
  it("returns the first hop from x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8, 9.10.11.12" },
    })
    expect(getRequestIp(req)).toBe("1.2.3.4")
  })

  it("trims whitespace around the first hop", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" },
    })
    expect(getRequestIp(req)).toBe("1.2.3.4")
  })

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "  9.9.9.9  " },
    })
    expect(getRequestIp(req)).toBe("9.9.9.9")
  })

  it("falls back to 127.0.0.1 when no headers are present", () => {
    const req = new Request("https://example.com")
    expect(getRequestIp(req)).toBe("127.0.0.1")
  })

  it("falls back to x-real-ip when x-forwarded-for is empty/comma-only", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": " , ", "x-real-ip": "9.9.9.9" },
    })
    expect(getRequestIp(req)).toBe("9.9.9.9")
  })
})

describe("buildRateLimitKey", () => {
  it("returns the ip when no extra is provided", () => {
    expect(buildRateLimitKey("1.2.3.4")).toBe("1.2.3.4")
    expect(buildRateLimitKey("1.2.3.4", null)).toBe("1.2.3.4")
    expect(buildRateLimitKey("1.2.3.4", undefined)).toBe("1.2.3.4")
  })

  it("appends and lowercases extra", () => {
    expect(buildRateLimitKey("1.2.3.4", "User@Example.com")).toBe(
      "1.2.3.4:user@example.com",
    )
  })

  it("trims whitespace on extra", () => {
    expect(buildRateLimitKey("1.2.3.4", "  Foo@Bar.COM  ")).toBe(
      "1.2.3.4:foo@bar.com",
    )
  })

  it("falls back to 'unknown' for empty ip", () => {
    expect(buildRateLimitKey("")).toBe("unknown")
    expect(buildRateLimitKey("", "a@b.com")).toBe("unknown:a@b.com")
  })
})

describe("minutesUntil", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns 1 for falsy reset", () => {
    expect(minutesUntil(0)).toBe(1)
  })

  it("returns 1 when reset is in the past", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))
    const past = Date.now() - 10_000
    expect(minutesUntil(past)).toBe(1)
  })

  it("rounds up partial minutes", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))
    expect(minutesUntil(Date.now() + 30_000)).toBe(1)
    expect(minutesUntil(Date.now() + 60_000)).toBe(1)
    expect(minutesUntil(Date.now() + 61_000)).toBe(2)
    expect(minutesUntil(Date.now() + 5 * 60_000)).toBe(5)
    expect(minutesUntil(Date.now() + 5 * 60_000 + 1)).toBe(6)
  })

  it("never returns less than 1", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))
    expect(minutesUntil(Date.now() + 1)).toBe(1)
  })
})
