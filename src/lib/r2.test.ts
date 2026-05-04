import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isR2Configured } from './r2'

const KEYS = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'] as const

describe('isR2Configured', () => {
  const originals: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of KEYS) originals[k] = process.env[k]
  })

  afterEach(() => {
    for (const k of KEYS) {
      if (originals[k] === undefined) delete process.env[k]
      else process.env[k] = originals[k]
    }
  })

  it('returns true when all four R2 vars are set', () => {
    process.env.R2_ACCOUNT_ID = 'acct'
    process.env.R2_ACCESS_KEY_ID = 'key'
    process.env.R2_SECRET_ACCESS_KEY = 'secret'
    process.env.R2_BUCKET_NAME = 'bucket'
    expect(isR2Configured()).toBe(true)
  })

  it('returns false when any single var is missing', () => {
    for (const missing of KEYS) {
      for (const k of KEYS) process.env[k] = 'value'
      delete process.env[missing]
      expect(isR2Configured(), `expected false when ${missing} missing`).toBe(false)
    }
  })

  it('returns false when all vars are unset', () => {
    for (const k of KEYS) delete process.env[k]
    expect(isR2Configured()).toBe(false)
  })
})
