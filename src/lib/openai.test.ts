import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AI_BASE_URL, AI_MODEL, isOpenAIConfigured } from './openai'

describe('isOpenAIConfigured', () => {
  let original: string | undefined

  beforeEach(() => {
    original = process.env.OPENAI_API_KEY
  })

  afterEach(() => {
    if (original === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = original
  })

  it('returns true when OPENAI_API_KEY is set', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key'
    expect(isOpenAIConfigured()).toBe(true)
  })

  it('returns false when OPENAI_API_KEY is unset', () => {
    delete process.env.OPENAI_API_KEY
    expect(isOpenAIConfigured()).toBe(false)
  })

  it('returns false when OPENAI_API_KEY is empty string', () => {
    process.env.OPENAI_API_KEY = ''
    expect(isOpenAIConfigured()).toBe(false)
  })
})

describe('module constants', () => {
  it('AI_MODEL is a non-empty string', () => {
    expect(typeof AI_MODEL).toBe('string')
    expect(AI_MODEL.length).toBeGreaterThan(0)
  })

  it('AI_BASE_URL is an absolute http(s) URL', () => {
    expect(AI_BASE_URL).toMatch(/^https?:\/\//)
  })
})
