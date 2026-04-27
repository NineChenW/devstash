import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { isEmailVerificationEnabled } from "@/lib/features"

describe("isEmailVerificationEnabled", () => {
  const original = process.env.EMAIL_VERIFICATION_ENABLED

  beforeEach(() => {
    delete process.env.EMAIL_VERIFICATION_ENABLED
  })

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EMAIL_VERIFICATION_ENABLED
    } else {
      process.env.EMAIL_VERIFICATION_ENABLED = original
    }
  })

  it("returns false when unset", () => {
    expect(isEmailVerificationEnabled()).toBe(false)
  })

  it("returns true for 'true' (any case, with whitespace)", () => {
    process.env.EMAIL_VERIFICATION_ENABLED = "true"
    expect(isEmailVerificationEnabled()).toBe(true)
    process.env.EMAIL_VERIFICATION_ENABLED = "TRUE"
    expect(isEmailVerificationEnabled()).toBe(true)
    process.env.EMAIL_VERIFICATION_ENABLED = "  True  "
    expect(isEmailVerificationEnabled()).toBe(true)
  })

  it("returns true for '1'", () => {
    process.env.EMAIL_VERIFICATION_ENABLED = "1"
    expect(isEmailVerificationEnabled()).toBe(true)
  })

  it("returns false for any other value", () => {
    for (const val of ["false", "0", "yes", "on", "", "FALSE", "2", "enabled"]) {
      process.env.EMAIL_VERIFICATION_ENABLED = val
      expect(isEmailVerificationEnabled()).toBe(false)
    }
  })
})
