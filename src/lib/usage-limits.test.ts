import { describe, it, expect } from "vitest"
import {
  checkItemQuota,
  checkCollectionQuota,
  gateForUploadKind,
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
