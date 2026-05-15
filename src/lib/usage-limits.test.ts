import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  checkItemQuota,
  checkCollectionQuota,
  gateForUploadKind,
  isProForGating,
} from "@/lib/usage-limits"

describe("checkItemQuota", () => {
  it("Pro user passes for non-Pro type without hitting the DB", async () => {
    const result = await checkItemQuota({
      userId: "any",
      isPro: true,
      typeName: "snippet",
    })
    expect(result.ok).toBe(true)
    expect(result.limit).toBe(Infinity)
  })

  it("Pro user passes for Pro-only types (file, image)", async () => {
    const file = await checkItemQuota({
      userId: "any",
      isPro: true,
      typeName: "file",
    })
    const image = await checkItemQuota({
      userId: "any",
      isPro: true,
      typeName: "image",
    })
    expect(file.ok).toBe(true)
    expect(image.ok).toBe(true)
  })

  it("Free user is blocked from creating file items with the right error", async () => {
    const result = await checkItemQuota({
      userId: "any",
      isPro: false,
      typeName: "file",
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe("file items are a Pro feature.")
  })

  it("Free user is blocked from creating image items with the right error", async () => {
    const result = await checkItemQuota({
      userId: "any",
      isPro: false,
      typeName: "image",
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe("image items are a Pro feature.")
  })
})

describe("checkCollectionQuota", () => {
  it("Pro user passes without hitting the DB", async () => {
    const result = await checkCollectionQuota({
      userId: "any",
      isPro: true,
    })
    expect(result.ok).toBe(true)
    expect(result.limit).toBe(Infinity)
  })
})

describe("gateForUploadKind", () => {
  it("Pro user passes for file uploads", () => {
    const result = gateForUploadKind({ isPro: true, kind: "file" })
    expect(result.ok).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("Pro user passes for image uploads", () => {
    const result = gateForUploadKind({ isPro: true, kind: "image" })
    expect(result.ok).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("Free user is blocked from file uploads with the right error", () => {
    const result = gateForUploadKind({ isPro: false, kind: "file" })
    expect(result.ok).toBe(false)
    expect(result.error).toBe("file items are a Pro feature.")
  })

  it("Free user is blocked from image uploads with the right error", () => {
    const result = gateForUploadKind({ isPro: false, kind: "image" })
    expect(result.ok).toBe(false)
    expect(result.error).toBe("image items are a Pro feature.")
  })
})

describe("isProForGating", () => {
  const originalNodeEnv = process.env.NODE_ENV

  function setNodeEnv(value: string) {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = value
  }

  beforeEach(() => {
    setNodeEnv("production")
  })

  afterEach(() => {
    setNodeEnv(originalNodeEnv ?? "test")
  })

  it("returns true regardless of session when NODE_ENV !== production (dev override)", () => {
    setNodeEnv("development")
    expect(isProForGating(null)).toBe(true)
    expect(isProForGating({})).toBe(true)
    expect(isProForGating({ user: null })).toBe(true)
    expect(isProForGating({ user: { isPro: false } })).toBe(true)
  })

  it("dev override also fires in 'test' mode", () => {
    setNodeEnv("test")
    expect(isProForGating({ user: { isPro: false } })).toBe(true)
  })

  it("returns true in production when session.user.isPro is true", () => {
    expect(isProForGating({ user: { isPro: true } })).toBe(true)
  })

  it("returns false in production when session.user.isPro is false", () => {
    expect(isProForGating({ user: { isPro: false } })).toBe(false)
  })

  it("returns false in production when isPro is undefined", () => {
    expect(isProForGating({ user: {} })).toBe(false)
  })

  it("returns false in production for null session", () => {
    expect(isProForGating(null)).toBe(false)
  })

  it("returns false in production when user is null", () => {
    expect(isProForGating({ user: null })).toBe(false)
  })
})
